"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface CreateStudentInvitationData {
  email: string
  fullName: string
  studentId: string
  invitedBy: string
}

interface StudentInvitation {
  id: string
  email: string
  invite_code: string
  student_id: string
  full_name: string
  is_registered: boolean
  is_password_reset: boolean
  created_at: string
  invited_by?: string
}

interface PasswordResetRequest {
  id: string
  user_id: string
  email: string
  reset_token: string
  expires_at: string
  used_at?: string
  created_at: string
  user?: {
    full_name: string
    student_id: string
  }
}

interface Student {
  id: string
  email: string
  full_name: string
  created_at: string
}

// Generate a 6-digit invitation code
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate a secure reset token
function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function addStudentInvitation(data: CreateStudentInvitationData) {
  try {
    const supabase = createServerClient()

    // Check if email already exists in invitations
    const { data: existingInvitation } = await supabase
      .from("student_invitations")
      .select("email")
      .eq("email", data.email.toLowerCase().trim())
      .eq("is_registered", false)
      .single()

    if (existingInvitation) {
      return {
        success: false,
        error: "A pending invitation for this email already exists",
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", data.email.toLowerCase().trim())
      .single()

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email already exists",
      }
    }

    // Check if student ID already exists
    const { data: existingStudentId } = await supabase
      .from("student_invitations")
      .select("student_id")
      .eq("student_id", data.studentId.trim())
      .single()

    if (existingStudentId) {
      return {
        success: false,
        error: "A student with this ID already exists",
      }
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode()
    let codeExists = true
    let attempts = 0

    while (codeExists && attempts < 10) {
      const { data: existingCode } = await supabase
        .from("student_invitations")
        .select("invite_code")
        .eq("invite_code", inviteCode)
        .single()

      if (!existingCode) {
        codeExists = false
      } else {
        inviteCode = generateInviteCode()
        attempts++
      }
    }

    if (attempts >= 10) {
      return {
        success: false,
        error: "Failed to generate unique invite code. Please try again.",
      }
    }

    // Create the invitation
    const { data: invitation, error } = await supabase
      .from("student_invitations")
      .insert({
        email: data.email.toLowerCase().trim(),
        invite_code: inviteCode,
        student_id: data.studentId.trim(),
        full_name: data.fullName.trim(),
        is_registered: false,
        is_password_reset: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error creating invitation:", error)
      return {
        success: false,
        error: "Failed to create student invitation: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
      inviteCode: inviteCode,
      invitation: invitation,
    }
  } catch (error: any) {
    console.error("Error creating student invitation:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function getStudentInvitations(): Promise<{
  success: boolean
  data: StudentInvitation[]
  error?: string
}> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("student_invitations")
      .select(`
        id,
        email,
        invite_code,
        student_id,
        full_name,
        is_registered,
        is_password_reset,
        created_at
      `)
      .eq("is_password_reset", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching invitations:", error)
      return {
        success: false,
        data: [],
        error: "Failed to fetch student invitations: " + error.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error: any) {
    console.error("Error fetching student invitations:", error)
    return {
      success: false,
      data: [],
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function getPasswordResetRequests(): Promise<{
  success: boolean
  data: PasswordResetRequest[]
  error?: string
}> {
  try {
    const supabase = createServerClient()

    // Get password reset requests from student_invitations table (legacy)
    const { data: legacyResets, error: legacyError } = await supabase
      .from("student_invitations")
      .select(`
        id,
        email,
        invite_code,
        full_name,
        student_id,
        created_at,
        is_registered
      `)
      .eq("is_password_reset", true)
      .order("created_at", { ascending: false })

    if (legacyError) {
      console.error("Database error fetching password resets:", legacyError)
      return {
        success: false,
        data: [],
        error: "Failed to fetch password reset requests: " + legacyError.message,
      }
    }

    // Transform legacy data to match PasswordResetRequest interface
    const transformedData: PasswordResetRequest[] = (legacyResets || []).map(reset => ({
      id: reset.id,
      user_id: "", // Not available in legacy format
      email: reset.email,
      reset_token: reset.invite_code,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      used_at: reset.is_registered ? new Date().toISOString() : undefined,
      created_at: reset.created_at,
      user: {
        full_name: reset.full_name,
        student_id: reset.student_id,
      }
    }))

    return {
      success: true,
      data: transformedData,
    }
  } catch (error: any) {
    console.error("Error fetching password reset requests:", error)
    return {
      success: false,
      data: [],
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function getRegisteredStudents(): Promise<{
  success: boolean
  data: Student[]
  error?: string
}> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        created_at
      `)
      .eq("role", "student")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching students:", error)
      return {
        success: false,
        data: [],
        error: "Failed to fetch students: " + error.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error: any) {
    console.error("Error fetching students:", error)
    return {
      success: false,
      data: [],
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function deleteStudentInvitation(invitationId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from("student_invitations")
      .delete()
      .eq("id", invitationId)

    if (error) {
      console.error("Database error deleting invitation:", error)
      return {
        success: false,
        error: "Failed to delete invitation: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error deleting student invitation:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function regenerateInviteCode(invitationId: string) {
  try {
    const supabase = createServerClient()

    // Generate new unique invite code
    let newCode = generateInviteCode()
    let codeExists = true
    let attempts = 0

    while (codeExists && attempts < 10) {
      const { data: existingCode } = await supabase
        .from("student_invitations")
        .select("invite_code")
        .eq("invite_code", newCode)
        .single()

      if (!existingCode) {
        codeExists = false
      } else {
        newCode = generateInviteCode()
        attempts++
      }
    }

    if (attempts >= 10) {
      return {
        success: false,
        error: "Failed to generate unique invite code. Please try again.",
      }
    }

    const { data, error } = await supabase
      .from("student_invitations")
      .update({
        invite_code: newCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .select()
      .single()

    if (error) {
      console.error("Database error regenerating code:", error)
      return {
        success: false,
        error: "Failed to regenerate invite code: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
      newInviteCode: newCode,
      invitation: data,
    }
  } catch (error: any) {
    console.error("Error regenerating invite code:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function createPasswordResetRequest(studentEmail: string) {
  try {
    const supabase = createServerClient()

    // Find the student
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("*")
      .eq("email", studentEmail)
      .eq("role", "student")
      .single()

    if (studentError || !student) {
      return {
        success: false,
        error: "Student not found",
      }
    }

    // Delete any existing password reset requests for this email
    await supabase
      .from("student_invitations")
      .delete()
      .eq("email", studentEmail)
      .eq("is_password_reset", true)

    // Generate reset token
    const resetToken = generateResetToken()

    // Create password reset request in student_invitations table (legacy approach)
    const { data: resetRequest, error } = await supabase
      .from("student_invitations")
      .insert({
        email: studentEmail,
        invite_code: resetToken,
        student_id: `RESET_${student.id.substring(0, 8)}`,
        full_name: student.full_name,
        is_registered: false,
        is_password_reset: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error creating password reset:", error)
      return {
        success: false,
        error: "Failed to create password reset request: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
      resetToken: resetToken,
      resetRequest: resetRequest,
    }
  } catch (error: any) {
    console.error("Error creating password reset request:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function deletePasswordResetRequest(requestId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from("student_invitations")
      .delete()
      .eq("id", requestId)
      .eq("is_password_reset", true)

    if (error) {
      console.error("Database error deleting password reset:", error)
      return {
        success: false,
        error: "Failed to delete password reset request: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error deleting password reset request:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function checkInvitationByCode(inviteCode: string) {
  try {
    const supabase = createServerClient()

    console.log("Checking invitation by code:", inviteCode)

    const { data: invitation, error } = await supabase
      .from("student_invitations")
      .select("*")
      .eq("invite_code", inviteCode.trim())
      .single()

    if (error) {
      console.error("Error checking invitation:", error)
      if (error.code === "PGRST116") {
        throw new Error("Invalid or expired invitation code")
      }
      throw new Error(error.message)
    }

    if (!invitation) {
      throw new Error("Invalid or expired invitation code")
    }

    if (invitation.is_registered) {
      throw new Error("This invitation has already been used")
    }

    console.log("Found valid invitation for:", invitation.email)
    return invitation
  } catch (error: any) {
    console.error("Error in checkInvitationByCode:", error)
    throw error
  }
}

export async function markInvitationAsRegistered(invitationId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from("student_invitations")
      .update({
        is_registered: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)

    if (error) {
      console.error("Database error marking invitation as registered:", error)
      return {
        success: false,
        error: "Failed to update invitation status: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error marking invitation as registered:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function deleteStudent(studentId: string) {
  try {
    const supabase = createServerClient()

    // Get student email first
    const { data: student, error: fetchError } = await supabase
      .from("users")
      .select("email")
      .eq("id", studentId)
      .eq("role", "student")
      .single()

    if (fetchError || !student) {
      return {
        success: false,
        error: "Student not found",
      }
    }

    // Delete from student_invitations first
    await supabase
      .from("student_invitations")
      .delete()
      .eq("email", student.email)

    // Delete from users table
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", studentId)
      .eq("role", "student")

    if (error) {
      console.error("Database error deleting student:", error)
      return {
        success: false,
        error: "Failed to delete student: " + error.message,
      }
    }

    revalidatePath("/admin/dashboard")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error deleting student:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}

export async function createUserAccount(userData: {
  email: string
  firebaseUid: string
  fullName: string
  studentId: string
}) {
  try {
    const supabase = createServerClient()

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        firebase_uid: userData.firebaseUid,
        email: userData.email.toLowerCase().trim(),
        full_name: userData.fullName.trim(),
        role: "student",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error creating user:", error)
      return {
        success: false,
        error: "Failed to create user account: " + error.message,
      }
    }

    return {
      success: true,
      user: user,
    }
  } catch (error: any) {
    console.error("Error creating user account:", error)
    return {
      success: false,
      error: "An unexpected error occurred: " + error.message,
    }
  }
}
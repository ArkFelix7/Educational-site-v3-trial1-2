"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function addStudentInvitation(data: {
  email: string
  fullName: string
  studentId: string
}) {
  try {
    // Check if email already exists
    const { data: existing } = await adminSupabase
      .from("student_invitations")
      .select("email")
      .eq("email", data.email.toLowerCase())
      .single()

    if (existing) {
      return { success: false, error: "Email already has an invitation" }
    }

    // Generate unique code
    let inviteCode = generateInviteCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existingCode } = await adminSupabase
        .from("student_invitations")
        .select("invite_code")
        .eq("invite_code", inviteCode)
        .single()

      if (!existingCode) break
      inviteCode = generateInviteCode()
      attempts++
    }

    const { data: invitation, error } = await adminSupabase
      .from("student_invitations")
      .insert({
        email: data.email.toLowerCase(),
        invite_code: inviteCode,
        student_id: data.studentId,
        full_name: data.fullName,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/dashboard")
    return { success: true, inviteCode, invitation }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getStudentInvitations() {
  try {
    const { data, error } = await adminSupabase
      .from("student_invitations")
      .select("*")
      .eq("is_used", false)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, data: [], error: error.message }
  }
}

export async function getRegisteredStudents() {
  try {
    const { data, error } = await adminSupabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, data: [], error: error.message }
  }
}

export async function deleteStudentInvitation(invitationId: string) {
  try {
    const { error } = await adminSupabase
      .from("student_invitations")
      .delete()
      .eq("id", invitationId)

    if (error) throw error
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteStudent(studentId: string) {
  try {
    // Get student info
    const { data: student } = await adminSupabase
      .from("users")
      .select("auth_id, email")
      .eq("id", studentId)
      .single()

    if (student) {
      // Delete from Supabase Auth
      await adminSupabase.auth.admin.deleteUser(student.auth_id)
      
      // Delete from users table
      await adminSupabase.from("users").delete().eq("id", studentId)
      
      // Delete any unused invitations
      await adminSupabase.from("student_invitations").delete().eq("email", student.email)
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function resetStudentPassword(studentEmail: string) {
  try {
    const { error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: studentEmail
    })

    if (error) throw error
    return { success: true, message: "Password reset email sent" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function checkInvitationByCode(inviteCode: string) {
  try {
    const { data: invitation, error } = await adminSupabase
      .from("student_invitations")
      .select("*")
      .eq("invite_code", inviteCode)
      .eq("is_used", false)
      .single()

    if (error || !invitation) {
      throw new Error("Invalid or expired invitation code")
    }

    return invitation
  } catch (error: any) {
    throw error
  }
}

export async function registerStudent(data: {
  invitationId: string
  email: string
  password: string
  fullName: string
  studentId: string
}) {
  try {
    // Create Supabase Auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        role: 'student'
      }
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create user")
    }

    // Create user profile
    const { error: profileError } = await adminSupabase
      .from("users")
      .insert({
        auth_id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: "student"
      })

    if (profileError) throw profileError

    // Mark invitation as used
    const { error: inviteError } = await adminSupabase
      .from("student_invitations")
      .update({ is_used: true })
      .eq("id", data.invitationId)

    if (inviteError) throw inviteError

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  UserPlus,
  Copy,
  Trash2,
  Users,
  RotateCcw,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Shield,
  Mail,
  Key,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  addStudentInvitation,
  getStudentInvitations,
  getPasswordResetRequests,
  getRegisteredStudents,
  deleteStudentInvitation,
  regenerateInviteCode,
  createPasswordResetRequest,
  deletePasswordResetRequest,
  deleteStudent,
} from "@/app/actions/enhanced-student-actions"

interface StudentInvitation {
  id: string
  email: string
  invite_code: string
  student_id: string
  full_name: string
  is_registered: boolean
  is_password_reset: boolean
  created_at: string
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

export default function RobustStudentManagement() {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([])
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("invitations")

  // Form state
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [invitationsResult, passwordResetsResult, studentsResult] = await Promise.all([
        getStudentInvitations(),
        getPasswordResetRequests(),
        getRegisteredStudents(),
      ])

      if (invitationsResult.success) {
        setInvitations(invitationsResult.data)
      }
      if (passwordResetsResult.success) {
        setPasswordResets(passwordResetsResult.data)
      }
      if (studentsResult.success) {
        setStudents(studentsResult.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await addStudentInvitation({
        email: email.trim(),
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        invitedBy: "admin",
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      const registrationLink = `${window.location.origin}/auth/register?token=${result.inviteCode}&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}`
      
      await navigator.clipboard.writeText(registrationLink)
      
      toast({
        title: "Student invitation created!",
        description: "Registration link copied to clipboard. Share with student.",
      })

      // Reset form
      setEmail("")
      setFullName("")
      setStudentId("")
      setIsAddDialogOpen(false)

      // Refresh data
      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyInviteLink = (invitation: StudentInvitation) => {
    const registrationLink = `${window.location.origin}/auth/register?token=${invitation.invite_code}&name=${encodeURIComponent(invitation.full_name)}&email=${encodeURIComponent(invitation.email)}`
    navigator.clipboard.writeText(registrationLink)
    toast({
      title: "Registration link copied!",
      description: `Link for ${invitation.full_name} copied to clipboard`,
    })
  }

  const copyResetLink = (token: string, email: string) => {
    const resetLink = `${window.location.origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    navigator.clipboard.writeText(resetLink)
    toast({
      title: "Reset link copied!",
      description: "Password reset link copied to clipboard",
    })
  }

  const copyInviteDetails = (invitation: StudentInvitation) => {
    const details = `Student Registration Details:
Name: ${invitation.full_name}
Email: ${invitation.email}
Student ID: ${invitation.student_id}
Invite Code: ${invitation.invite_code}

Instructions:
1. Go to the student registration page
2. Enter your email: ${invitation.email}
3. Enter the 6-digit code: ${invitation.invite_code}
4. Create your password
5. Start learning!`

    navigator.clipboard.writeText(details)
    toast({
      title: "Complete details copied!",
      description: "All registration information copied to clipboard",
    })
  }

  const handleDeleteInvitation = async (id: string) => {
    try {
      const result = await deleteStudentInvitation(id)
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Invitation deleted",
        description: "The invitation has been removed",
      })

      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRegenerateCode = async (invitationId: string, studentName: string) => {
    try {
      const result = await regenerateInviteCode(invitationId)
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "New code generated",
        description: `New invite code for ${studentName}: ${result.newInviteCode}`,
      })

      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreatePasswordReset = async (studentEmail: string) => {
    try {
      const result = await createPasswordResetRequest(studentEmail)
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Password reset created",
        description: `Reset token: ${result.resetToken}`,
      })

      fetchAllData()
      setActiveTab("resets") // Switch to password resets tab
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeletePasswordReset = async (requestId: string) => {
    try {
      const result = await deletePasswordResetRequest(requestId)
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Password reset deleted",
        description: "The password reset request has been removed",
      })

      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteStudent(studentId)
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Student deleted",
        description: `${studentName} has been removed from the system`,
      })

      fetchAllData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const toggleShowCode = (id: string) => {
    setShowCodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pendingInvitations = invitations.filter(inv => !inv.is_registered)
  const activePasswordResets = passwordResets.filter(reset => !reset.used_at)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">Manage student registrations, password resets, and access</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  placeholder="STU001"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invitation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
                <p className="text-2xl font-bold">{pendingInvitations.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Password Resets</p>
                <p className="text-2xl font-bold">{activePasswordResets.length}</p>
              </div>
              <Key className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invitations</p>
                <p className="text-2xl font-bold">{pendingInvitations.length}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Student Invitations</span>
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resets" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Password Resets</span>
            {activePasswordResets.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activePasswordResets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Active Students</span>
            <Badge variant="default" className="ml-2">
              {students.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Student Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Student Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                  <p className="text-sm">Create an invitation to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Details</TableHead>
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invitation.full_name}</div>
                            <div className="text-sm text-muted-foreground">{invitation.email}</div>
                            <div className="text-xs text-muted-foreground">ID: {invitation.student_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {showCodes[invitation.id] ? invitation.invite_code : "••••••"}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleShowCode(invitation.id)}
                            >
                              {showCodes[invitation.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInviteLink(invitation)}
                              title="Copy registration link"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInviteDetails(invitation)}
                              title="Copy all details"
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateCode(invitation.id, invitation.full_name)}
                              title="Generate new code"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              title="Delete invitation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Resets Tab */}
        <TabsContent value="resets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Password Reset Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activePasswordResets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active password reset requests</p>
                  <p className="text-sm">Password resets will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Details</TableHead>
                      <TableHead>Reset Token</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePasswordResets.map((reset) => (
                      <TableRow key={reset.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reset.user?.full_name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{reset.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Reset Request
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-red-100 px-2 py-1 rounded text-sm font-mono text-red-800">
                              {showCodes[reset.id] ? reset.reset_token : "••••••••••••"}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleShowCode(reset.id)}
                            >
                              {showCodes[reset.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(reset.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyResetLink(reset.reset_token, reset.email)}
                              title="Copy reset link"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePasswordReset(reset.id)}
                              title="Delete reset request"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No registered students</p>
                  <p className="text-sm">Students will appear here after registration</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Details</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">STU{String(students.indexOf(student) + 1).padStart(3, '0')}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(student.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreatePasswordReset(student.email)}
                              title="Create password reset"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Reset Password
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteStudent(student.id, student.full_name)}
                              title="Delete student"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Student Management Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Student Invitations
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Create invitations for new students</li>
                <li>• Share 6-digit codes for registration</li>
                <li>• Regenerate codes if needed</li>
                <li>• Track invitation status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Password Resets
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Generate reset links for existing students</li>
                <li>• Separate from regular invitations</li>
                <li>• Time-limited reset tokens</li>
                <li>• Clean up used/expired resets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Active Students
              </h4>
              <ul className="text-sm space-y-1">
                <li>• View all registered students</li>
                <li>• Track registration dates</li>
                <li>• Manage student accounts</li>
                <li>• Generate password resets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
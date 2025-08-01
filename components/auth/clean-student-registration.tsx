'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { checkInvitationByCode, registerStudent } from '@/app/actions/clean-student-actions'
import { CheckCircle, Mail, Key, UserPlus } from 'lucide-react'

interface CleanStudentRegistrationProps {
  token?: string
  name?: string
  email?: string
}

export function CleanStudentRegistration({ token, name, email }: CleanStudentRegistrationProps) {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'register'>('verify')
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)

  const [formData, setFormData] = useState({
    email: email || '',
    inviteCode: token || '',
    password: '',
    confirmPassword: ''
  })

  const handleVerifyInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const invitationData = await checkInvitationByCode(formData.inviteCode)
      
      if (invitationData.email.toLowerCase() !== formData.email.toLowerCase()) {
        throw new Error('Email does not match the invitation')
      }

      setInvitation(invitationData)
      setStep('register')
      
      toast({
        title: 'Invitation verified!',
        description: `Welcome ${invitationData.full_name}! Please create your password.`,
      })

    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid invitation code or email',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive'
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const result = await registerStudent({
        invitationId: invitation.id,
        email: invitation.email,
        password: formData.password,
        fullName: invitation.full_name,
        studentId: invitation.student_id
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Registration successful!',
        description: 'Your account has been created. You can now log in.',
      })

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Student Registration</CardTitle>
          <CardDescription>
            Enter your email and invitation code to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyInvitation} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="inviteCode" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>6-Digit Invitation Code</span>
              </Label>
              <Input
                id="inviteCode"
                type="text"
                value={formData.inviteCode}
                onChange={(e) => setFormData(prev => ({ ...prev, inviteCode: e.target.value.replace(/\\D/g, '').slice(0, 6) }))}
                required
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || formData.inviteCode.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          Welcome {invitation?.full_name}! Set up your password to complete registration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Invitation verified!</strong><br />
            Email: {invitation?.email}<br />
            Student ID: {invitation?.student_id}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              placeholder="Create a secure password"
            />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={6}
              placeholder="Confirm your password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
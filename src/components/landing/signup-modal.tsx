"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupModal({ open, onOpenChange, tier }: { open: boolean; onOpenChange: (open: boolean) => void; tier?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    studioName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.email || !formData.password || !formData.studioName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          studioName: formData.studioName,
          tier: tier || 'starter',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setEmailSent(true);
      } else {
        toast.error(data.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setFormData({ firstName: '', email: '', password: '', studioName: '' });
    onOpenChange(false);
  };

  if (emailSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#C9A84C]/20 text-white">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#C9A84C]/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#C9A84C]" />
            </div>
            <DialogTitle className="text-white">Check Your Email!</DialogTitle>
            <DialogDescription className="text-gray-400">
              We&apos;ve sent a verification link to <strong className="text-[#C9A84C]">{formData.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-400 text-center">
              Click the link in the email to verify your account and activate your studio. The link expires in 24 hours.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <Button onClick={handleClose} variant="outline" className="w-full border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#C9A84C]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create Your Studio</DialogTitle>
          <DialogDescription className="text-gray-400">
            Start your 7-day free trial
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-firstName" className="text-gray-300">Your Name</Label>
            <Input
              id="modal-firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-email" className="text-gray-300">Email Address</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C]/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-studioName" className="text-gray-300">Studio Name</Label>
            <Input
              id="modal-studioName"
              placeholder="My Studio"
              value={formData.studioName}
              onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C]/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-semibold h-11"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Studio...
              </div>
            ) : (
              'Start Free Trial'
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push('/sign-in');
              }}
              className="text-[#C9A84C] hover:underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token");
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Complex Geometric Background Pattern */}
      <div className="absolute inset-0">
        {/* Corner geometric shapes with connecting lines */}
        {/* Top Left Corner Complex */}
        <div className="absolute top-12 left-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute top-2 left-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -top-1 -left-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Top Right Corner Complex */}
        <div className="absolute top-12 right-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute top-2 right-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Bottom Left Corner Complex */}
        <div className="absolute bottom-12 left-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Bottom Right Corner Complex */}
        <div className="absolute bottom-12 right-12">
          <div className="w-24 h-24 border border-gray-600 transform rotate-45 opacity-40"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-white opacity-60 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border border-gray-500 opacity-30"></div>
        </div>

        {/* Connecting lines from corners to center */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
              <stop
                offset="20%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="80%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
              <stop
                offset="20%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="80%"
                style={{ stopColor: "#4B5563", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "transparent", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          {/* Horizontal connecting lines */}
          <line
            x1="120"
            y1="60"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="calc(100% - 120)"
            y1="60"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="120"
            y1="calc(100% - 60)"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="calc(100% - 120)"
            y1="calc(100% - 60)"
            x2="50%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Additional geometric lines */}
          <line
            x1="0"
            y1="30%"
            x2="25%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="100%"
            y1="30%"
            x2="75%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="0"
            y1="70%"
            x2="25%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1="100%"
            y1="70%"
            x2="75%"
            y2="50%"
            stroke="url(#grad1)"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>

        {/* Additional floating geometric elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-400 opacity-30 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 border border-gray-500 opacity-25 transform rotate-45"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gray-400 opacity-30 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 border border-gray-500 opacity-25 transform rotate-45"></div>
      </div>

      <Card className="w-full max-w-md z-10 bg-gray-800 text-gray-200 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-200">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleResetPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !token}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
          <p className="text-sm text-center text-gray-400">
            Back to{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

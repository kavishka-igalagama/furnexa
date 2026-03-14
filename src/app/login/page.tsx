"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail } from "lucide-react";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password");
      return;
    }

    const session = await getSession();
    const nextPath = session?.user?.role === "ADMIN" ? "/admin" : "/design";
    router.push(nextPath);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-4xl grid lg:grid-cols-2 gap-8 bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-elevated overflow-hidden"
      >
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-cta text-warm-dark-foreground">
          <div>
            <div className="inline-flex items-center gap-2 bg-warm-dark-foreground/10 border border-warm-dark-foreground/20 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em]">
              Furnexa Studio
            </div>
            <h1 className="font-display text-4xl font-bold mt-6">
              Welcome Back,
              <br />
              Designer
            </h1>
            <p className="text-sm text-warm-dark-foreground/70 mt-4">
              Sign in to access your saved room designs and continue crafting
              immersive spaces for your clients.
            </p>
          </div>
          <div className="text-xs text-warm-dark-foreground/60">
            Don&apos;t have an account? Create one in minutes.
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                Login
              </p>
              <h2 className="font-display text-3xl font-bold mt-2">
                Sign in to Furnexa
              </h2>
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="designer@furnexa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            New here?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;


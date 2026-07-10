"use client"

import { useTheme } from "next-themes"
import React from "react"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import {TreePine , BookOpen, Users } from "lucide-react"

export default function LoginPage() {
  const { resolvedTheme } = useTheme()

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950">
        <Image
          src="/img/chiclayo.jpg"
          alt="Profesionales capacitándose en Brusben"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10 shadow-inner" />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {/* Logo Column */}
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Image
                className="object-contain"
                src="/img/sis_logo.png"
                alt="Profesionales capacitándose en Brusben"
                fill
                priority
              />
            </div>
            

            {/* Title Column */}
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white">SisParques</span>
              <p className="text-white/60 text-sm">MPCH</p>
            </div>
          </div>
        </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm mb-6">
                Gestión para el<br/>
                <span className="text-white/90">mantenimiento y control de parques</span>
              </h2>
              <p className="mt-4 text-md text-white/70 leading-relaxed max-w-md">
                Optimiza el monitoreo, la conservación y el seguimiento de áreas verdes  en una sola plataforma centralizada.
              </p>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg leading-none">+50</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">Control y monitoreo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg leading-none">+120</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">Ubicación geográfica</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/40 font-medium font-mono uppercase tracking-[0.2em]">
            © Plataforma Digital de Control y Monitoreo.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-sidebar relative overflow-hidden dark:bg-secondary">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0  -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0  rounded-full  -ml-48 -mb-48" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
          </div>

          <div className="absolute top-0 right-0 lg:-top-2">
            <ThemeToggle />
          </div>

          <div className="flex justify-center lg:justify-start">
              <Image
                src={
                  resolvedTheme === "dark"
                    ? "/img/logo_mpch.png"
                    : "/img/logo_mpch.png"
                }
                alt="Logo SisParques"
                width={250}
                height={300}
                className="object-contain"
                style={{ height: 'auto' }}
                priority
              />
          </div>

          {/* Login Form (Titles are INSIDE this component now) */}
          <LoginForm />

        </div>
      </div>
    </div>
  )
}

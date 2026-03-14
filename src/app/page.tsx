"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  Box,
  ChevronDown,
  ClipboardList,
  Eye,
  Instagram,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Maximize,
  Menu,
  Paintbrush,
  Palette,
  PenTool,
  Play,
  Save,
  Sparkles,
  Twitter,
  UserCircle,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import heroImage from "@public/hero-living-room.jpg";
import galleryLiving from "@public/gallery-living-room.jpg";
import galleryDining from "@public/gallery-dining.jpg";
import galleryOffice from "@public/gallery-office.jpg";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Gallery", href: "#gallery" },
];

const features = [
  {
    icon: Palette,
    title: "Room Customization",
    description:
      "Enter room specifications including size, shape, and colour scheme to create an accurate virtual representation.",
  },
  {
    icon: Box,
    title: "3D Visualization",
    description:
      "Convert your 2D layouts into stunning 3D views for an immersive, realistic room presentation.",
  },
  {
    icon: Maximize,
    title: "Perfect Scaling",
    description:
      "Automatically scale furniture items to fit room dimensions, ensuring spatial accuracy every time.",
  },
  {
    icon: Paintbrush,
    title: "Furniture Customization",
    description:
      "Apply shading and change colours for individual pieces or the entire design to match any aesthetic.",
  },
  {
    icon: Save,
    title: "Save & Edit Designs",
    description:
      "Save completed designs for future reference. Edit or delete existing designs with ease.",
  },
  {
    icon: UserCircle,
    title: "Designer Accounts",
    description:
      "Secure login for designers to manage their portfolio and access saved designs anytime.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    number: "01",
    title: "Enter Room Details",
    description:
      "Input room dimensions, shape, and preferred colour scheme to set the foundation for your design.",
  },
  {
    icon: PenTool,
    number: "02",
    title: "Create 2D Design",
    description:
      "Arrange furniture shapes on the 2D canvas, experimenting with different layouts and configurations.",
  },
  {
    icon: Eye,
    number: "03",
    title: "View in 3D",
    description:
      "Convert your layout into an immersive 3D visualization to see how it looks in the real world.",
  },
  {
    icon: Sparkles,
    number: "04",
    title: "Customize & Refine",
    description:
      "Apply shading, adjust colours, scale furniture, and fine-tune every detail to perfection.",
  },
];

const galleryItems = [
  {
    image: galleryLiving,
    title: "Modern Living Room",
    description:
      "A serene space featuring clean lines, natural materials, and soft neutral tones.",
    tags: ["Contemporary", "Minimalist", "Warm"],
  },
  {
    image: galleryDining,
    title: "Dining Area",
    description:
      "Elegant dining setup with sculptural lighting and rich terracotta accents.",
    tags: ["Elegant", "Warm Tones", "Modern"],
  },
  {
    image: galleryOffice,
    title: "Home Office",
    description:
      "A productive workspace combining functionality with sophisticated design.",
    tags: ["Functional", "Sophisticated", "Cozy"],
  },
];

const getDisplayName = (user?: {
  name?: string | null;
  email?: string | null;
}) => {
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email?.trim()) return user.email.trim().split("@")[0];
  return "Designer";
};

const getInitials = (user?: { name?: string | null; email?: string | null }) => {
  const displayName = getDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const NavbarAuth = ({ mobile = false }: { mobile?: boolean }) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return mobile ? (
      <div className="mt-3 h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
    ) : (
      <div className="ml-4 h-10 w-44 animate-pulse rounded-full bg-muted/60" />
    );
  }

  if (!session?.user) {
    return (
      <Button
        asChild
        variant="default"
        size="sm"
        className={
          mobile
            ? "mt-3 w-fit rounded-full bg-accent px-6 font-body text-accent-foreground hover:bg-accent/90"
            : "ml-4 rounded-full bg-accent px-6 font-body text-accent-foreground shadow-gold hover:bg-accent/90"
        }
      >
        <Link href="/login">Login</Link>
      </Button>
    );
  }

  const displayName = getDisplayName(session.user);
  const dashboardHref = session.user.role === "ADMIN" ? "/admin" : "/design";
  const dashboardLabel =
    session.user.role === "ADMIN" ? "Admin panel" : "My designs";
  const roleLabel = session.user.role === "ADMIN" ? "Administrator" : "Designer";

  if (mobile) {
    return (
      <div className="mt-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="ring-2 ring-accent/20">
            <AvatarImage
              src={session.user.image ?? undefined}
              alt={displayName}
            />
            <AvatarFallback className="bg-accent/10 font-semibold text-accent">
              {getInitials(session.user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {session.user.email ?? roleLabel}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            asChild
            size="sm"
            className="rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90"
          >
            <Link href={dashboardHref}>{dashboardLabel}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-4 flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-left shadow-soft transition-colors hover:border-accent/40 hover:bg-background"
        >
          <Avatar size="default" className="ring-2 ring-accent/20">
            <AvatarImage
              src={session.user.image ?? undefined}
              alt={displayName}
            />
            <AvatarFallback className="bg-accent/10 font-semibold text-accent">
              {getInitials(session.user)}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-36">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border-border/60 p-2"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {session.user.email ?? roleLabel}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2">
          <Link href={dashboardHref}>
            <LayoutDashboard className="h-4 w-4" />
            {dashboardLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-xl px-3 py-2"
          onSelect={(event) => {
            event.preventDefault();
            void signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HomePage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const currentYear = new Date().getFullYear();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sections = navLinks.map(
      (l) => document.querySelector(l.href) as HTMLElement | null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection("#" + entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl shadow-soft border-b border-border/40"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between h-18 px-4 lg:px-8 py-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-display text-2xl font-bold tracking-tight text-foreground group flex items-center gap-2"
          >
            <span className="inline-flex w-8 h-8 rounded-lg bg-accent items-center justify-center">
              <span className="text-accent-foreground text-sm font-bold">
                F
              </span>
            </span>
            <span className="group-hover:text-accent transition-colors duration-300">
              Furnexa
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-full ${
                  activeSection === link.href
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {activeSection === link.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-accent/10 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </a>
            ))}
            <NavbarAuth />
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-foreground p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
            >
              <div className="flex flex-col gap-1 p-5">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`text-base font-medium px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === link.href
                        ? "text-accent bg-accent/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={(e) => handleNavClick(e, link.href)}
                  >
                    {link.label}
                  </a>
                ))}
                <NavbarAuth mobile />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Image with parallax feel */}
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={heroImage.src}
            alt="Modern luxury living room with warm earth tones"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          {/* Decorative grain overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-warm-dark-foreground/10 backdrop-blur-sm border border-warm-dark-foreground/20 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-warm-dark-foreground/90">
                Interior Design Visualization
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] text-warm-dark-foreground mb-6"
            >
              Craft Your{" "}
              <span className="relative">
                <span className="text-gradient-gold">Dream Space</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-1 left-0 w-full h-0.75 bg-accent origin-left rounded-full"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-warm-dark-foreground/70 leading-relaxed mb-10 max-w-lg"
            >
              Design stunning furniture layouts in 2D and experience them in
              immersive 3D. Help your customers visualize their perfect room
              before making a decision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/design">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-base px-8 rounded-full shadow-gold group cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-warm-dark-foreground/25 text-warm-dark-foreground bg-warm-dark-foreground/10 hover:bg-warm-dark-foreground/20 hover:text-warm-dark-foreground font-body text-base px-8 rounded-full backdrop-blur-sm group cursor-pointer"
              >
                <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex gap-8 mt-16 pt-8 border-t border-warm-dark-foreground/15"
            >
              {[
                { value: "50+", label: "Designs Created" },
                { value: "98%", label: "Client Satisfaction" },
                { value: "3D", label: "Visualization" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-display font-bold text-warm-dark-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-warm-dark-foreground/50 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
              Features
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed for furniture designers to create,
              visualize, and perfect room layouts.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                className="group bg-card rounded-xl p-8 border border-border/60 hover:border-accent/40 transition-all duration-300 hover:shadow-medium"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Work Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-secondary/50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
              Process
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From room specs to a realistic 3D view — in just four simple
              steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-background border-2 border-accent/30 flex items-center justify-center mb-6 shadow-soft">
                    <step.icon className="h-8 w-8 text-accent" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-2">
                    Step {step.number}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
              Inspiration
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Design Gallery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore beautifully designed rooms created with Furnexa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="group overflow-hidden rounded-xl border border-border/60 bg-card hover:shadow-elevated transition-all duration-500"
              >
                <div className="relative overflow-hidden aspect-4/3">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-accent/10 text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-cta relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(35 30% 95%) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-warm-dark-foreground mb-6">
              Ready to Design
              <br />
              <span className="text-gradient-gold">Something Beautiful?</span>
            </h2>
            <p className="text-lg text-warm-dark-foreground/70 max-w-xl mx-auto mb-10">
              Sign in as a designer and start creating stunning room
              visualizations for your customers today.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-base px-10 shadow-gold cursor-pointer"
            >
              Sign In as Designer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold text-primary-foreground">
                Furnexa
              </span>
              <span className="text-sm text-primary-foreground/50">
                © {currentYear} All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>

            <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
              <a
                href="#"
                className="hover:text-primary-foreground transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-primary-foreground transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="hover:text-primary-foreground transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  Users,
  TrendingUp,
  BarChart3,
  Flame,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as const },
  }),
};

const features = [
  {
    icon: Target,
    title: "Habit Tracking",
    description: "Build streaks, track daily habits, and see your progress with beautiful heatmaps.",
    color: "#059669",
  },
  {
    icon: Users,
    title: "Accountability Groups",
    description: "Create groups for study, fitness, coding, or any goal. Stay accountable together.",
    color: "#059669",
  },
  {
    icon: TrendingUp,
    title: "Daily Progress Reports",
    description: "Submit daily updates with evidence. Track hours, tasks, mood, and productivity.",
    color: "#3b82f6",
  },
  {
    icon: MessageSquare,
    title: "Peer Reviews",
    description: "Get constructive feedback from your group. Reactions, comments, and structured reviews.",
    color: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Beautiful charts showing your trends, consistency scores, and improvement areas.",
    color: "#06b6d4",
  },
  {
    icon: Flame,
    title: "Streak System",
    description: "Never break the chain. Streaks, leaderboards, and accountability scores keep you going.",
    color: "#f97316",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Groups Created" },
  { value: "2M+", label: "Habits Tracked" },
  { value: "95%", label: "Consistency Rate" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ 
        background: "rgba(5, 10, 8, 0.8)", 
        backdropFilter: "blur(12px)",
        borderColor: "var(--color-border-subtle)" 
      }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <Zap className="w-6 h-6 text-white" />
            <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              Momentum
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "var(--color-text-secondary)" }}>
              Log In
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #059669, transparent)" }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{
              background: "var(--color-accent-glow)",
              color: "var(--color-accent-primary)",
              border: "1px solid rgba(5, 150, 105, 0.3)",
            }}
          >
            <Flame className="w-4 h-4" />
            The accountability platform for achievers
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            Build habits.
            <br />
            <span className="gradient-text">Stay accountable.</span>
            <br />
            Achieve together.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Track progress together, review each other&apos;s work, and stay consistent 
            through social accountability. Your friends, your goals, your momentum.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup" className="btn-primary text-base px-8 py-3">
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3">
              <Shield className="w-5 h-5" /> I have an account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6 border-y" style={{ 
        borderColor: "var(--color-border-subtle)",
        background: "var(--color-bg-secondary)" 
      }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Everything you need to <span className="gradient-text">stay on track</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              A complete toolkit for building habits, tracking progress, and holding each other accountable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              How it works
            </h2>
            <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
              Three simple steps to transform your productivity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create or Join a Group",
                description: "Find your people — study buddies, gym partners, or coding friends. Set goals and rules together.",
              },
              {
                step: "02",
                title: "Track & Submit Daily",
                description: "Log your habits, submit daily progress reports, and upload evidence of your work.",
              },
              {
                step: "03",
                title: "Review & Grow",
                description: "Get feedback from peers, climb leaderboards, maintain streaks, and watch your consistency soar.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                <div className="text-6xl font-black mb-4 gradient-text opacity-30">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at center, #059669, transparent 70%)" }} />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
            Ready to build <span className="gradient-text-fire">unstoppable momentum</span>?
          </h2>
          <p className="text-lg mb-10" style={{ color: "var(--color-text-secondary)" }}>
            Join thousands who are achieving their goals through social accountability.
          </p>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4">
            Get Started — It&apos;s Free <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-success)" }} /> Free forever</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-success)" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-success)" }} /> Instant setup</span>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ 
        borderColor: "var(--color-border-subtle)",
        background: "var(--color-bg-secondary)" 
      }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Momentum</span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            © 2025 Momentum. Built for achievers, by achievers.
          </p>
        </div>
      </footer>
    </div>
  );
}

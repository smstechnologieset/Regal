"use client";

/**
 * Regal Main Landing Page
 *
 * Company landing page showcasing all 4 services:
 * - Attire Store (clothing e-commerce)
 * - Event Planning (packages and custom events)
 * - Bridal Services (gowns, makeup, hair, fittings)
 * - Catering (event-based catering packages)
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shirt,
  PartyPopper,
  Heart,
  UtensilsCrossed,
  Star,
  Users,
  Award,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";

// Services data
const services = [
  {
    id: "attire",
    name: "Attire Store",
    tagline: "Fashion for Every Occasion",
    description:
      "Discover the latest trends in fashion. Shop our curated collection of clothing, accessories, and more.",
    icon: Shirt,
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
    href: "/attire",
    color: "from-primary/80 to-primary",
    available: true,
  },
  {
    id: "events",
    name: "Event Planning",
    tagline: "Create Unforgettable Moments",
    description:
      "From intimate gatherings to grand celebrations. Choose from our packages or create your custom event.",
    icon: PartyPopper,
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
    href: "/events",
    color: "from-secondary/80 to-secondary",
    available: true,
  },
  {
    id: "bridal",
    name: "Bridal Services",
    tagline: "Your Perfect Day Awaits",
    description:
      "Complete bridal solutions including gowns, makeup, hair styling, fittings, and reservations.",
    icon: Heart,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
    href: "/bridal",
    color: "from-primary/80 to-primary",
    available: true,
  },
  {
    id: "catering",
    name: "Catering",
    tagline: "Exquisite Flavors for Every Event",
    description:
      "Premium catering packages for weddings, birthdays, graduations, and corporate events.",
    icon: UtensilsCrossed,
    image:
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop",
    href: "/catering",
    color: "from-secondary/80 to-secondary",
    available: true,
  },
];

// Stats
const stats = [
  { icon: Users, value: "10,000+", label: "Happy Customers" },
  { icon: Star, value: "4.9", label: "Average Rating" },
  { icon: Award, value: "50+", label: "Awards Won" },
  { icon: Clock, value: "10+", label: "Years Experience" },
];

export default function RegalLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-primary text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-8 animate-fade-in">
              <Star size={16} className="text-amber-400" />
              <span>Trusted by thousands of customers</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up">
              Welcome to <span className="text-secondary">Regal</span>
            </h1>

            {/* Tagline */}
            <p
              className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Your One-Stop Destination for Style, Celebrations, and
              Unforgettable Experiences
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link href="#services">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight size={18} />}
                >
                  Explore Our Services
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white hover:text-primary"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">
              Our Services
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-primary mt-4 mb-6">
              Everything You Need, All in One Place
            </h2>
            <p className="text-lg text-slate-600">
              From fashion to celebrations, we&apos;ve got you covered with our
              comprehensive range of premium services.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <Link
                key={service.id}
                href={service.available ? service.href : "#"}
                className={`group relative overflow-hidden rounded-2xl ${
                  !service.available && "cursor-not-allowed"
                }`}
              >
                <div className="aspect-[16/10] relative">
                  {/* Background Image */}
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-80 group-hover:opacity-90 transition-opacity`}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                      <service.icon size={28} />
                    </div>

                    {/* Text */}
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      {service.name}
                    </h3>
                    <p className="text-white/80 font-medium mb-1">
                      {service.tagline}
                    </p>
                    <p className="text-white/60 text-sm mb-4 max-w-md">
                      {service.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 font-medium">
                      {service.available ? (
                        <>
                          <span>Explore Now</span>
                          <ArrowRight
                            size={18}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden relative">
                <Image
                  src="https://images.unsplash.com/photo-1614317354806-860a3bf79069?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Regal Team"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-6 max-w-xs hidden md:block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 border-2 border-white"
                      />
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-primary">
                      1000+ Reviews
                    </div>
                    <div className="text-slate-500">on Google</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                  <span className="ml-2 font-semibold">4.9</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <span className="text-secondary font-medium text-sm uppercase tracking-wider">
                Why Choose Regal
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-4 mb-6">
                We Turn Your Dreams Into Reality
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                With over 10 years of experience, Regal has become the go-to
                destination for premium fashion, unforgettable events, and
                exceptional service. We take pride in making every moment
                special.
              </p>

              <div className="space-y-4">
                {[
                  "Premium quality products and services",
                  "Expert team dedicated to your satisfaction",
                  "Customized solutions for every need",
                  "24/7 customer support",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-secondary flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/attire">
                  <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Experience Regal?
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Regal for their
            fashion and celebration needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Link href="/attire">
                            <Button size="lg" variant="secondary">
                                Shop Attire
                            </Button>
                        </Link> */}
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-primary"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getBridalAccessories } from "@/lib/services/bridal";
import { BridalAccessory } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

export default function BridalAccessoriesPage() {
  const [filter, setFilter] = useState("all");
  const [accessories, setAccessories] = useState<BridalAccessory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccessories() {
      setLoading(true);
      const data = await getBridalAccessories();
      setAccessories(data);
      setLoading(false);
    }
    fetchAccessories();
  }, []);

  const categories = ["all", "veil", "jewelry", "headpiece", "shoes", "clutch"];

  const filteredAccessories =
    filter === "all"
      ? accessories
      : accessories.filter(
          (item) => item.category.toLowerCase() === filter.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/bridal"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-4"
          >
            <ArrowLeft size={20} />
            Back to Bridal
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-primary font-serif">
                Bridal Accessories
              </h1>
              <p className="text-slate-600 mt-2">
                Complete your bridal look with elegant accessories.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-slate-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                filter === cat
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAccessories.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {item.isNew && (
                    <div className="absolute top-4 left-4">
                      <Badge type="new" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex gap-2">
                      <Link
                        href={`/bridal/appointments?accessory=${item.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full bg-white text-primary hover:bg-slate-100"
                        >
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-bold text-base text-primary">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {item.category}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-primary">
                        Rent: {formatPrice(item.priceRent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Buy: {formatPrice(item.priceBuy)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAccessories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              No accessories found for this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

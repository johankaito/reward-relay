"use client";

import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Recommendation } from "@/lib/recommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
  variant?: "hero" | "compact";
}

export function RecommendationCard({
  recommendation,
  variant = "hero",
}: RecommendationCardProps) {
  const { card, reason, eligibleNow } = recommendation;

  if (variant === "compact") {
    return (
      <Link
        href={card.application_link || "#"}
        target={card.application_link ? "_blank" : undefined}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--accent)] hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--accent)]">{card.bank}</p>
            <h4 className="text-lg font-semibold text-white">{card.name}</h4>
          </div>
          {eligibleNow && (
            <div className="rounded-full bg-[var(--success-bg)] px-2 py-1 text-xs font-semibold text-[var(--success-fg)]">
              Eligible
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-4 text-sm">
          {card.welcome_bonus_points && (
            <div>
              <span className="text-2xl font-bold text-white">
                {card.welcome_bonus_points.toLocaleString()}
              </span>
              <span className="ml-1 text-slate-400">pts</span>
            </div>
          )}
          {card.annual_fee !== null && (
            <div className="text-slate-300">
              <span className="font-semibold">${card.annual_fee}</span>
              <span className="text-slate-400"> fee</span>
            </div>
          )}
        </div>

        <p className="text-sm text-[var(--accent)]">{reason}</p>
      </Link>
    );
  }

  // Hero variant
  return (
    <Card className="overflow-hidden border-2 border-[var(--accent)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)] shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Recommended for you
            </p>
          </div>
          {eligibleNow && (
            <div className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-semibold text-[var(--success-fg)]">
              Eligible Now
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-400">{card.bank}</p>
            <h3 className="text-2xl font-bold text-white">{card.name}</h3>
          </div>

          <div className="flex flex-wrap items-baseline gap-6">
            {card.welcome_bonus_points && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {card.welcome_bonus_points.toLocaleString()}
                  </span>
                  <span className="text-lg text-slate-400">bonus points</span>
                </div>
                {card.bonus_spend_requirement && (
                  <p className="mt-1 text-sm text-slate-400">
                    Spend ${card.bonus_spend_requirement.toLocaleString()} in{" "}
                    {card.bonus_spend_window_months || 3} months
                  </p>
                )}
              </div>
            )}

            {card.annual_fee !== null && (
              <div className="rounded-xl bg-[var(--surface-soft)] px-4 py-2">
                <p className="text-sm text-slate-400">Annual Fee</p>
                <p className="text-2xl font-bold text-white">${card.annual_fee}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-[var(--info-bg)]/30 border border-[var(--info-bg)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--accent)]">{reason}</p>
          </div>

          {card.notes && (
            <p className="text-sm text-slate-300">{card.notes}</p>
          )}

          <div className="flex gap-3 pt-2">
            {card.application_link && (
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-full text-white shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
              >
                <Link href={card.application_link} target="_blank" rel="noopener noreferrer">
                  Apply now
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full"
            >
              <Link href="/recommendations">See all</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

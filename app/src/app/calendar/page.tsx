"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface UserCard {
  id: string;
  card_id: string | null;
  bank: string | null;
  name: string | null;
  status: string;
  application_date: string | null;
  approval_date: string | null;
  cancellation_date: string | null;
  card: {
    id: string;
    bank: string;
    name: string;
    welcome_bonus_points?: number;
  } | null;
}

interface BankTimeline {
  bank: string;
  cards: CardTimeline[];
  eligibilityDate: Date | null;
  daysUntilEligible: number | null;
}

interface CardTimeline {
  card: UserCard;
  stages: {
    applied: { date: Date | null; complete: boolean };
    approved: { date: Date | null; complete: boolean };
    active: { date: Date | null; complete: boolean };
    cancelled: { date: Date | null; complete: boolean };
    eligible: { date: Date | null; complete: boolean };
  };
}

export default function CalendarPage() {
  const [bankTimelines, setBankTimelines] = useState<BankTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimelines();
  }, []);

  const loadTimelines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cards, error } = await supabase
        .from("user_cards")
        .select(`
          *,
          card:cards(*)
        `)
        .eq("user_id", user.id)
        .order("application_date", { ascending: false });

      if (error) throw error;

      // Group cards by bank and calculate timelines
      const bankMap = new Map<string, UserCard[]>();

      (cards || []).forEach((card: any) => {
        const bank = card.card?.bank || "Unknown";
        if (!bankMap.has(bank)) {
          bankMap.set(bank, []);
        }
        bankMap.get(bank)!.push(card);
      });

      // Calculate timelines for each bank
      const timelines: BankTimeline[] = [];

      bankMap.forEach((bankCards, bank) => {
        const cardTimelines = bankCards.map((card) => ({
          card,
          stages: {
            applied: {
              date: card.application_date ? new Date(card.application_date) : null,
              complete: !!card.application_date,
            },
            approved: {
              date: card.approval_date ? new Date(card.approval_date) : null,
              complete: !!card.approval_date,
            },
            active: {
              date: null, // Could add activation_date field
              complete: card.status === "active",
            },
            cancelled: {
              date: card.cancellation_date ? new Date(card.cancellation_date) : null,
              complete: !!card.cancellation_date && card.status === "cancelled",
            },
            eligible: {
              date: card.cancellation_date
                ? new Date(
                    new Date(card.cancellation_date).setMonth(
                      new Date(card.cancellation_date).getMonth() + 12
                    )
                  )
                : null,
              complete: false,
            },
          },
        }));

        // Find most recent cancellation for this bank
        const cancelledCards = bankCards.filter((c) => c.cancellation_date);
        let eligibilityDate: Date | null = null;
        let daysUntilEligible: number | null = null;

        if (cancelledCards.length > 0) {
          const mostRecentCancellation = cancelledCards.reduce((latest, card) => {
            const cardDate = new Date(card.cancellation_date!);
            return !latest || cardDate > new Date(latest.cancellation_date!)
              ? card
              : latest;
          });

          eligibilityDate = new Date(
            new Date(mostRecentCancellation.cancellation_date!).setMonth(
              new Date(mostRecentCancellation.cancellation_date!).getMonth() + 12
            )
          );

          const today = new Date();
          const daysRemaining = Math.ceil(
            (eligibilityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          daysUntilEligible = daysRemaining > 0 ? daysRemaining : 0;

          // Mark as eligible if past the date
          cardTimelines.forEach((ct) => {
            if (ct.stages.eligible.date && ct.stages.eligible.date <= today) {
              ct.stages.eligible.complete = true;
            }
          });
        }

        timelines.push({
          bank,
          cards: cardTimelines,
          eligibilityDate,
          daysUntilEligible,
        });
      });

      // Sort by eligibility (most urgent first)
      timelines.sort((a, b) => {
        if (!a.daysUntilEligible && !b.daysUntilEligible) return 0;
        if (!a.daysUntilEligible) return 1;
        if (!b.daysUntilEligible) return -1;
        return a.daysUntilEligible - b.daysUntilEligible;
      });

      setBankTimelines(timelines);
    } catch (error) {
      console.error("Error loading timelines:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEligibilityStatus = (daysUntilEligible: number | null) => {
    if (daysUntilEligible === null) return null;
    if (daysUntilEligible === 0) {
      return { text: "Eligible Now!", color: "default", icon: CheckCircle };
    }
    if (daysUntilEligible < 30) {
      return { text: `${daysUntilEligible} days`, color: "secondary", icon: Clock };
    }
    const months = Math.floor(daysUntilEligible / 30);
    return {
      text: `${months} month${months > 1 ? "s" : ""}`,
      color: "outline",
      icon: AlertCircle,
    };
  };

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Churning Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your card lifecycle and eligibility windows
          </p>
        </div>
      </div>

      {bankTimelines.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No cards found. Add cards to see your churning timeline.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {bankTimelines.map((timeline) => {
            const eligibilityStatus = getEligibilityStatus(timeline.daysUntilEligible);
            const StatusIcon = eligibilityStatus?.icon;

            return (
              <Card key={timeline.bank} className="p-6" data-bank-timeline={timeline.bank}>
                {/* Bank Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{timeline.bank}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {timeline.cards.length} card{timeline.cards.length > 1 ? "s" : ""} tracked
                    </p>
                  </div>
                  {eligibilityStatus && (
                    <Badge variant={eligibilityStatus.color as any} className="flex items-center gap-1">
                      {StatusIcon && <StatusIcon className="h-3 w-3" />}
                      {eligibilityStatus.text}
                    </Badge>
                  )}
                </div>

                {/* Eligibility Info */}
                {timeline.eligibilityDate && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">
                        {timeline.daysUntilEligible === 0
                          ? "You're eligible to apply for this bank again!"
                          : `Eligible to reapply: ${formatDate(timeline.eligibilityDate)}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Timelines */}
                <div className="space-y-4">
                  {timeline.cards.map(({ card, stages }) => (
                    <div key={card.id} className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
                      <h3 className="font-semibold mb-3">{card.card?.name || card.name || "Unknown Card"}</h3>

                      {/* Timeline Stages */}
                      <div className="space-y-2">
                        {/* Applied */}
                        <div className="flex items-center gap-3">
                          {stages.applied.complete ? (
                            <CheckCircle className="h-5 w-5 text-gray-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium">Applied</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDate(stages.applied.date)}
                            </span>
                          </div>
                        </div>

                        {/* Approved */}
                        <div className="flex items-center gap-3">
                          {stages.approved.complete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium">Approved</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDate(stages.approved.date)}
                            </span>
                          </div>
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-3">
                          {stages.active.complete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium">Active</span>
                            {card.status === "active" && (
                              <Badge variant="default" className="ml-2 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Cancelled */}
                        {stages.cancelled.complete && (
                          <div className="flex items-center gap-3">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <div className="flex-1">
                              <span className="text-sm font-medium">Cancelled</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDate(stages.cancelled.date)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Eligible Again */}
                        {stages.eligible.date && (
                          <div className="flex items-center gap-3">
                            {stages.eligible.complete ? (
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-500" />
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium">Eligible to Reapply</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDate(stages.eligible.date)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span>Eligible</span>
          </div>
        </div>
      </Card>
      </div>
    </AppShell>
  );
}
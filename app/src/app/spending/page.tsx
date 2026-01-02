"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Plus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserCard {
  id: string;
  card_id: string;
  status: string;
  applied_date: string | null;
  approved_date: string | null;
  activated_date: string | null;
  annual_fee_paid: number | null;
  welcome_bonus_received: boolean;
  notes: string | null;
  current_spend: number;
  spend_target: number;
  spend_deadline: string | null;
  card: {
    id: string;
    bank: string;
    name: string;
    welcome_bonus_points?: number;
    bonus_spend_requirement?: number;
    bonus_spend_window_months?: number;
  };
}

interface SpendingTransaction {
  id: string;
  user_card_id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
}

export default function SpendingTrackerPage() {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [transactions, setTransactions] = useState<Record<string, SpendingTransaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "general",
  });


  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user cards with spending requirements
      const { data: cards, error } = await supabase
        .from("user_cards")
        .select(`
          *,
          card:cards(*)
        `)
        .eq("user_id", user.id)
        .in("status", ["active", "pending_spend"])
        .order("activated_date", { ascending: false });

      if (error) throw error;

      // Calculate current spend and deadlines
      const enrichedCards = (cards || []).map((card: any) => {
        const spendTarget = card.card?.bonus_spend_requirement || 0;
        const windowMonths = card.card?.bonus_spend_window_months || 3;

        let deadline = null;
        if (card.activated_date && spendTarget > 0) {
          const activatedDate = new Date(card.activated_date);
          deadline = new Date(activatedDate.setMonth(activatedDate.getMonth() + windowMonths));
        }

        return {
          ...card,
          current_spend: card.current_spend || 0,
          spend_target: spendTarget,
          spend_deadline: deadline?.toISOString() || null,
        };
      });

      setUserCards(enrichedCards);

      // Load transactions for each card
      const cardIds = enrichedCards.map((c) => c.id);
      await loadTransactions(cardIds);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (cardIds: string[]) => {
    // In a real app, this would load from a transactions table
    // For now, we'll simulate with empty data
    const transactionMap: Record<string, SpendingTransaction[]> = {};
    cardIds.forEach((id) => {
      transactionMap[id] = [];
    });
    setTransactions(transactionMap);
  };

  const handleAddTransaction = async () => {
    if (!selectedCard || !newTransaction.amount) return;

    try {
      // In a real app, this would save to a transactions table
      // For now, we'll update the current_spend directly
      const newSpend = (selectedCard.current_spend || 0) + parseFloat(newTransaction.amount);

      const { error } = await supabase
        .from("user_cards")
        .update({ current_spend: newSpend })
        .eq("id", selectedCard.id);

      if (error) throw error;

      // Update local state
      setUserCards((cards) =>
        cards.map((c: UserCard) =>
          c.id === selectedCard.id ? { ...c, current_spend: newSpend } : c
        )
      );

      // Reset form
      setNewTransaction({
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "general",
      });
      setIsAddingTransaction(false);
      setSelectedCard(null);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const getSpendingStatus = (card: UserCard) => {
    if (!card.spend_target) return { status: "no_target", color: "gray" };

    const progress = (card.current_spend / card.spend_target) * 100;
    const daysLeft = card.spend_deadline
      ? Math.ceil((new Date(card.spend_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    if (progress >= 100) {
      return { status: "completed", color: "green", icon: CheckCircle };
    }

    if (daysLeft !== null && daysLeft < 14) {
      return { status: "urgent", color: "red", icon: AlertCircle };
    }

    if (daysLeft !== null && daysLeft < 30) {
      return { status: "warning", color: "yellow", icon: Clock };
    }

    return { status: "on_track", color: "blue", icon: TrendingUp };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Spending Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your progress toward minimum spend requirements
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Active Cards</div>
          <div className="text-2xl font-bold">{userCards.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Cards Needing Spend</div>
          <div className="text-2xl font-bold">
            {userCards.filter((c) => c.spend_target > 0 && c.current_spend < c.spend_target).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Target Spend</div>
          <div className="text-2xl font-bold">
            {formatCurrency(userCards.reduce((sum, c) => sum + (c.spend_target || 0), 0))}
          </div>
        </Card>
      </div>

      {/* Card Spending Progress */}
      <div className="space-y-4">
        {userCards.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No active cards with spending requirements
            </p>
            <Button className="mt-4" onClick={() => (window.location.href = "/cards")}>
              Add Cards
            </Button>
          </Card>
        ) : (
          userCards.map((card) => {
            const status = getSpendingStatus(card);
            const progress = card.spend_target
              ? (card.current_spend / card.spend_target) * 100
              : 0;
            const StatusIcon = status.icon || TrendingUp;

            return (
              <Card key={card.id} className="p-6" data-spending-card={card.id}>
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {card.card.bank} - {card.card.name}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant={
                            status.status === "completed"
                              ? "default"
                              : status.status === "urgent"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.status === "completed"
                            ? "Target Met"
                            : status.status === "urgent"
                            ? "Urgent"
                            : status.status === "warning"
                            ? "Deadline Soon"
                            : "On Track"}
                        </Badge>
                        {card.spend_deadline && (
                          <Badge variant="outline">
                            Due: {formatDate(card.spend_deadline)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Dialog
                      open={isAddingTransaction && selectedCard?.id === card.id}
                      onOpenChange={(open) => {
                        setIsAddingTransaction(open);
                        if (open) setSelectedCard(card);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Spend
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Transaction</DialogTitle>
                          <DialogDescription>
                            Record a purchase made with this card
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Amount (AUD)</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="100.00"
                              value={newTransaction.amount}
                              onChange={(e) =>
                                setNewTransaction({ ...newTransaction, amount: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              placeholder="e.g., Groceries at Woolworths"
                              value={newTransaction.description}
                              onChange={(e) =>
                                setNewTransaction({
                                  ...newTransaction,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newTransaction.date}
                              onChange={(e) =>
                                setNewTransaction({ ...newTransaction, date: e.target.value })
                              }
                            />
                          </div>
                          <Button onClick={handleAddTransaction} className="w-full">
                            Add Transaction
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Progress Bar */}
                  {card.spend_target > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{formatCurrency(card.current_spend)}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatCurrency(card.spend_target)}
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {progress >= 100
                          ? "Congratulations! You've met the spending requirement"
                          : `${formatCurrency(
                              card.spend_target - card.current_spend
                            )} remaining to earn ${
                              card.card.welcome_bonus_points?.toLocaleString() || "bonus"
                            } points`}
                      </div>
                    </div>
                  )}

                  {/* Recent Transactions */}
                  {transactions[card.id]?.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                      <div className="space-y-1">
                        {transactions[card.id].slice(0, 3).map((txn) => (
                          <div
                            key={txn.id}
                            className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                          >
                            <span>{txn.description}</span>
                            <span>{formatCurrency(txn.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
      </div>
    </AppShell>
  );
}
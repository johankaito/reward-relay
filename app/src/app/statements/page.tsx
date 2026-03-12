"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUp, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";

interface UserCard {
  id: string;
  card: {
    bank: string;
    name: string;
  } | null;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  rawRow: Record<string, unknown>;
}

const CATEGORY_KEYWORDS = {
  groceries: ["coles", "woolworths", "iga", "aldi", "foodworks", "supermarket"],
  dining: [
    "restaurant",
    "cafe",
    "coffee",
    "ubereats",
    "menulog",
    "deliveroo",
    "doordash",
    "mcdonald",
    "kfc",
    "hungry jack",
    "domino",
    "subway",
    "pizza",
  ],
  travel: [
    "qantas",
    "virgin",
    "jetstar",
    "airline",
    "hotel",
    "airbnb",
    "booking.com",
    "expedia",
    "flight centre",
    "taxi",
    "uber",
  ],
  fuel: ["bp", "shell", "caltex", "7-eleven", "ampol", "metro petroleum"],
  other: [],
};

export default function StatementsPage() {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cards, error } = await supabase
        .from("user_cards")
        .select(`
          id,
          card:cards(bank, name)
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      // Filter out cards with null card data
      setUserCards((cards || []).filter(c => c.card !== null));
    } catch (error) {
      console.error("Error loading cards:", error);
    }
  };

  const categorizeTransaction = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === "other") continue;
      if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return "other";
  };

  const parseCSV = (file: File) => {
    setParseError(null);
    setTransactions([]);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const parsedTransactions: Transaction[] = [];
          const data = results.data as Record<string, string>[];

          // Detect bank format and parse accordingly
          const headers = Object.keys(data[0] || {}).map((h) => h.toLowerCase());

          for (const row of data) {
            let date: string = "";
            let description: string = "";
            let amount: number = 0;

            // CommBank format: Date, Description, Debit, Credit, Balance
            if (headers.includes("date") && (headers.includes("debit") || headers.includes("credit"))) {
              date = row["Date"] || row["date"];
              description = row["Description"] || row["description"];
              const debit = parseFloat((row["Debit"] || row["debit"] || "0").replace(/[^0-9.-]/g, ""));
              const credit = parseFloat(
                (row["Credit"] || row["credit"] || "0").replace(/[^0-9.-]/g, "")
              );
              amount = credit > 0 ? credit : debit;
            }
            // ANZ/NAB format: Date, Description, Amount, Balance
            else if (headers.includes("date") && headers.includes("amount")) {
              date = row["Date"] || row["date"];
              description = row["Description"] || row["description"] || row["Narrative"] || row["narrative"];
              amount = Math.abs(
                parseFloat((row["Amount"] || row["amount"] || "0").replace(/[^0-9.-]/g, ""))
              );
            }
            // Generic fallback
            else {
              // Try to find date-like column
              for (const key of headers) {
                if (key.includes("date") || key === "date") {
                  date = row[key];
                  break;
                }
              }
              // Try to find description-like column
              for (const key of headers) {
                if (
                  key.includes("description") ||
                  key.includes("narrative") ||
                  key === "description"
                ) {
                  description = row[key];
                  break;
                }
              }
              // Try to find amount-like column
              for (const key of headers) {
                if (key.includes("amount") || key === "debit" || key === "credit") {
                  amount = Math.abs(parseFloat((row[key] || "0").replace(/[^0-9.-]/g, "")));
                  if (amount > 0) break;
                }
              }
            }

            // Skip if no valid data
            if (!date || !description || amount === 0 || isNaN(amount)) continue;

            // Parse date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) continue;

            parsedTransactions.push({
              date: parsedDate.toISOString().split("T")[0],
              description: description.trim(),
              amount: Math.abs(amount),
              category: categorizeTransaction(description),
              rawRow: row,
            });
          }

          if (parsedTransactions.length === 0) {
            setParseError(
              "No valid transactions found. Please check your CSV format."
            );
          } else {
            setTransactions(parsedTransactions);
          }
        } catch (error: unknown) {
          setParseError(`Failed to parse CSV: ${(error as Error).message}`);
        }
      },
      error: (error) => {
        setParseError(`CSV parsing error: ${error.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      setParseError("Please select a valid CSV file");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      parseCSV(droppedFile);
    } else {
      setParseError("Please drop a valid CSV file");
    }
  };

  const handleUpload = async () => {
    if (!selectedCard || transactions.length === 0) return;

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert transactions
      const transactionRecords = transactions.map((txn) => ({
        user_card_id: selectedCard,
        user_id: user.id,
        amount: txn.amount,
        description: txn.description,
        transaction_date: txn.date,
        category: txn.category,
      }));

      const { error } = await supabase
        .from("spending_transactions")
        .insert(transactionRecords);

      if (error) throw error;

      // Success
      alert(`Successfully uploaded ${transactions.length} transactions!`);
      setFile(null);
      setTransactions([]);
      setSelectedCard("");
    } catch (error: unknown) {
      console.error("Upload error:", error);
      alert(`Failed to upload transactions: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateCategory = (index: number, newCategory: string) => {
    const updated = [...transactions];
    updated[index].category = newCategory;
    setTransactions(updated);
  };

  const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Spending
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            Import statements
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Upload a bank CSV to automatically categorise your spending
          </p>
        </div>

      {/* Card Selection */}
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] p-5 shadow-sm">
        <Label htmlFor="card-select" className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
          Select card
        </Label>
        <Select value={selectedCard} onValueChange={setSelectedCard}>
          <SelectTrigger id="card-select">
            <SelectValue placeholder="Choose a card..." />
          </SelectTrigger>
          <SelectContent>
            {userCards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.card?.bank} - {card.card?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* File Upload */}
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] p-5 shadow-sm">
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--border-default)] p-10 text-center transition-colors hover:border-[var(--accent)]/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
          <p className="mb-1 font-medium text-[var(--text-primary)]">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Supports CommBank, ANZ, NAB, Westpac formats
          </p>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {file && (
            <Badge className="mt-4" variant="secondary">
              {file.name}
            </Badge>
          )}
        </div>

        {parseError && (
          <div
            className="mt-4 flex items-start gap-2 rounded-lg border p-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--danger) 10%, transparent)",
              borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)",
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--danger)]" />
            <p className="text-sm text-[var(--danger)]">{parseError}</p>
          </div>
        )}
      </Card>

      {/* Transaction Preview */}
      {transactions.length > 0 && (
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Preview</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {transactions.length} transactions · ${totalAmount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedCard || uploading}
            >
              {uploading ? "Uploading..." : "Upload Transactions"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border-default)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 50).map((txn, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{txn.date}</TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell className="font-mono">
                      ${txn.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={txn.category}
                        onValueChange={(value) => updateCategory(index, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="groceries">Groceries</SelectItem>
                          <SelectItem value="dining">Dining</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="fuel">Fuel</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {transactions.length > 50 && (
              <div className="bg-[var(--surface-muted)] p-3 text-center text-sm text-[var(--text-secondary)]">
                Showing first 50 of {transactions.length} transactions
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Supported Formats */}
      <Card className="border border-[var(--border-default)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Supported formats</h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
            <span>CommBank — Date, Description, Debit, Credit, Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
            <span>ANZ — Date, Description, Amount, Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
            <span>NAB — Date, Description, Amount, Balance, Category</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--success-fg)]" />
            <span>Westpac — Date, Narrative, Debit, Credit, Balance</span>
          </div>
        </div>
      </Card>
      </div>
    </AppShell>
  );
}
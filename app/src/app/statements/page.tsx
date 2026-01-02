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
  rawRow: any;
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
          const data = results.data as any[];

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
        } catch (error: any) {
          setParseError(`Failed to parse CSV: ${error.message}`);
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
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload transactions: ${error.message}`);
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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Upload Statement</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Import bank statements to automatically track spending
          </p>
        </div>
      </div>

      {/* Card Selection */}
      <Card className="p-6">
        <Label htmlFor="card-select" className="text-lg font-semibold mb-3 block">
          Select Card
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
      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
          </div>
        )}
      </Card>

      {/* Transaction Preview */}
      {transactions.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Preview Transactions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {transactions.length} transactions • Total: ${totalAmount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedCard || uploading}
            >
              {uploading ? "Uploading..." : "Upload Transactions"}
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
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
              <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                Showing first 50 of {transactions.length} transactions
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Supported Formats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Supported Bank Formats</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>CommBank: Date, Description, Debit, Credit, Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>ANZ: Date, Description, Amount, Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>NAB: Date, Description, Amount, Balance, Category</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Westpac: Date, Narrative, Debit, Credit, Balance</span>
          </div>
        </div>
      </Card>
      </div>
    </AppShell>
  );
}
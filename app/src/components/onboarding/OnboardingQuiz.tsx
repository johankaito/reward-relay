"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useAnalytics } from "@/contexts/AnalyticsContext"

type SpendingCategory = "groceries" | "dining" | "travel" | "shopping" | "mixed"
type OptimizationGoal = "points" | "cashback" | "both"
type ChurningGoal = "domestic" | "international" | "cashback" | "unsure"

interface QuizAnswers {
  spending_category: SpendingCategory
  optimization_goal: OptimizationGoal
  churning_goal: ChurningGoal
}

export function OnboardingQuiz() {
  const router = useRouter()
  const { trackEvent } = useAnalytics()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAnswer = (key: keyof QuizAnswers, value: string) => {
    setAnswers({ ...answers, [key]: value })

    // Track each answer
    trackEvent("onboarding_question_answered", {
      question: key,
      answer: value,
      step: step,
    })

    // Auto-advance to next step
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!answers.spending_category || !answers.optimization_goal || !answers.churning_goal) {
      toast.error("Please answer all questions")
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Save answers to user profile
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          spending_category: answers.spending_category,
          optimization_goal: answers.optimization_goal,
          churning_goal: answers.churning_goal,
          onboarding_completed_at: new Date().toISOString(),
        })

      if (error) throw error

      // Track completion
      trackEvent("onboarding_completed", {
        spending_category: answers.spending_category,
        optimization_goal: answers.optimization_goal,
        churning_goal: answers.churning_goal,
      })

      toast.success("Profile set up! Let's find your first recommendation")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving onboarding answers:", error)
      toast.error("Failed to save answers. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4">
      <Card className="w-full max-w-2xl border border-[var(--border-default)] bg-[var(--surface)] shadow-xl">
        <CardHeader>
          <div className="mb-4 flex justify-between text-sm text-slate-400">
            <span>Question {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% complete</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            {step === 1 && "Let's personalize your experience"}
            {step === 2 && "What's your goal?"}
            {step === 3 && "Almost there!"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question 1: Spending Category */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg text-slate-300">
                What's your primary spending category?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <OptionButton
                  onClick={() => handleAnswer("spending_category", "groceries")}
                  selected={answers.spending_category === "groceries"}
                  icon="🛒"
                  title="Groceries"
                  description="Supermarkets, weekly shopping"
                />
                <OptionButton
                  onClick={() => handleAnswer("spending_category", "dining")}
                  selected={answers.spending_category === "dining"}
                  icon="🍽️"
                  title="Dining"
                  description="Restaurants, cafes, food delivery"
                />
                <OptionButton
                  onClick={() => handleAnswer("spending_category", "travel")}
                  selected={answers.spending_category === "travel"}
                  icon="✈️"
                  title="Travel"
                  description="Flights, hotels, bookings"
                />
                <OptionButton
                  onClick={() => handleAnswer("spending_category", "shopping")}
                  selected={answers.spending_category === "shopping"}
                  icon="🛍️"
                  title="Shopping"
                  description="Retail, online purchases"
                />
                <OptionButton
                  onClick={() => handleAnswer("spending_category", "mixed")}
                  selected={answers.spending_category === "mixed"}
                  icon="💳"
                  title="Mixed"
                  description="Spend evenly across categories"
                  className="sm:col-span-2"
                />
              </div>
            </div>
          )}

          {/* Question 2: Optimization Goal */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-lg text-slate-300">
                What are you optimizing for?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <OptionButton
                  onClick={() => handleAnswer("optimization_goal", "points")}
                  selected={answers.optimization_goal === "points"}
                  icon="⭐"
                  title="Maximize points"
                  description="Get the most points/miles for redemptions"
                />
                <OptionButton
                  onClick={() => handleAnswer("optimization_goal", "cashback")}
                  selected={answers.optimization_goal === "cashback"}
                  icon="💰"
                  title="Minimize fees"
                  description="Avoid annual fees, maximize cashback"
                />
                <OptionButton
                  onClick={() => handleAnswer("optimization_goal", "both")}
                  selected={answers.optimization_goal === "both"}
                  icon="🎯"
                  title="Both equally"
                  description="Balance points and fee management"
                />
              </div>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mt-4 text-slate-400"
              >
                ← Back
              </Button>
            </div>
          )}

          {/* Question 3: Churning Goal */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-lg text-slate-300">
                What's your churning goal?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <OptionButton
                  onClick={() => handleAnswer("churning_goal", "domestic")}
                  selected={answers.churning_goal === "domestic"}
                  icon="🏠"
                  title="Free domestic flights"
                  description="Sydney to Melbourne, Brisbane, etc."
                />
                <OptionButton
                  onClick={() => handleAnswer("churning_goal", "international")}
                  selected={answers.churning_goal === "international"}
                  icon="🌏"
                  title="International travel"
                  description="Asia, Europe, long-haul flights"
                />
                <OptionButton
                  onClick={() => handleAnswer("churning_goal", "cashback")}
                  selected={answers.churning_goal === "cashback"}
                  icon="💵"
                  title="Cashback & savings"
                  description="Reduce fees, maximize cash rewards"
                />
                <OptionButton
                  onClick={() => handleAnswer("churning_goal", "unsure")}
                  selected={answers.churning_goal === "unsure"}
                  icon="❓"
                  title="Not sure yet"
                  description="Help me figure out the best approach"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-slate-400"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !answers.churning_goal}
                  className="flex-1 text-white"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup →"}
                </Button>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex gap-2 pt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-teal-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface OptionButtonProps {
  onClick: () => void
  selected: boolean
  icon: string
  title: string
  description: string
  className?: string
}

function OptionButton({ onClick, selected, icon, title, description, className = "" }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all hover:scale-[1.02] ${
        selected
          ? "border-teal-500 bg-teal-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      } ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        {selected && (
          <div className="text-2xl text-teal-500">✓</div>
        )}
      </div>
    </button>
  )
}

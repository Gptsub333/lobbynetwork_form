"use client"

import type React from "react"
import { useState } from "react"

interface FormData {
  firstName: string
  lastName: string
  email: string
  subscriptionTier: string
  addOns: string[]
  mobileNumber: string
  companyName: string
  companyWebsite: string
  hearAboutUs: string
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    subscriptionTier: "none",
    addOns: [],
    mobileNumber: "",
    companyName: "",
    companyWebsite: "",
    hearAboutUs: "",
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const subscriptionTiers = [
    { id: "foundation", label: "Foundation", price: "$99/month", value: 99 },
    { id: "builder", label: "Builder", price: "$975/month", value: 975 },
    { id: "flagship", label: "Flagship", price: "$1875/month", value: 1875 },
  ]

  const addOnOptions = [
    { id: "job-event", label: "Boost a Job or Event", price: "$495", value: 495 },
    { id: "virtual-hiring", label: "Virtual Hiring Event", price: "$1500", value: 1500 },
    { id: "hiring-event", label: "In-Person Hiring Event", price: "$5000", value: 5000 },
    { id: "network-sponsorship", label: "Sponsor a Networking Event", price: "$2000", value: 2000 },
  ]

  const hearAboutUsOptions = ["google", "website", "referral", "other"]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddOnChange = (addOnId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      addOns: checked
        ? [...prev.addOns, addOnId]
        : prev.addOns.filter((id) => id !== addOnId),
    }))
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange("mobileNumber", formatted)
  }

  const handleSubscriptionClick = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subscriptionTier: prev.subscriptionTier === id ? "none" : id,
    }))
  }

  const handleClearSubscription = () => {
    setFormData((prev) => ({
      ...prev,
      subscriptionTier: "none",
    }))
  }

  const calculateTotal = () => {
    let total = 0
    const selectedTier = subscriptionTiers.find(
      (tier) => tier.id === formData.subscriptionTier
    )
    if (selectedTier) {
      total += selectedTier.value
    }
    formData.addOns.forEach((addOnId) => {
      const addOn = addOnOptions.find((option) => option.id === addOnId)
      if (addOn) {
        total += addOn.value
      }
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.subscriptionTier === "none" && formData.addOns.length === 0) {
      setFormError("Please select a subscription tier or at least one add-on.")
      return
    }
    setFormError(null)
    setIsLoading(true)

    const total = calculateTotal()
    const selectedTier = subscriptionTiers.find(
      (tier) => tier.id === formData.subscriptionTier
    )
    const selectedTierLabel = selectedTier?.label ?? "None"
    const selectedAddOnLabels = formData.addOns
      .map((addOnId) => addOnOptions.find((option) => option.id === addOnId)?.label)
      .filter(Boolean)

    const airtablePayload = {
      ...formData,
      subscriptionTier: selectedTierLabel,
      addOns: selectedAddOnLabels,
      total,
    }

    try {
      const airtableRes = await fetch("/api/submitToAirtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(airtablePayload),
      })

      const airtableData = await airtableRes.json()

      if (!airtableRes.ok) {
        setIsLoading(false)
        alert("Failed to submit to Airtable.")
        return
      }
      const recordId = airtableData.airtableResponse.id

      const stripeSessionRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTier: formData.subscriptionTier === "none" ? null : formData.subscriptionTier,
          selectedAddons: formData.addOns,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          metadata: {
            recordId,
            email: formData.email,
            mobileNumber: formData.mobileNumber,
          },
        }),
      })

      const stripeSession = await stripeSessionRes.json()

      if (!stripeSessionRes.ok || !stripeSession.sessionId) {
        setIsLoading(false)
        alert("Payment initiation failed.")
        return
      }

      const stripe = await (await import("@stripe/stripe-js")).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      )

      if (!stripe) {
        setIsLoading(false)
        alert("Stripe initialization failed.")
        return
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: stripeSession.sessionId,
      })

      if (error) {
        setIsLoading(false)
        alert("Stripe checkout failed. Try again.")
      }
    } catch (error) {
      setIsLoading(false)
      alert("Something went wrong. Please try again.")
    }
    // Do not setIsLoading(false) here because user will be redirected away
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg font-inter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started Today</h2>
        <p className="text-gray-600">
          Choose your plan and let's build something amazing together.
        </p>
      </div>

      {formError && (
        <div className="mb-4 text-red-600 font-medium">{formError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-800 mb-2"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-800 mb-2"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Subscription Tiers */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-4">
            Subscription Tier <span className="text-gray-500">
            </span>
          </label>
          <div className="space-y-4">
            {subscriptionTiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="radio"
                  id={tier.id}
                  name="subscriptionTier"
                  value={tier.id}
                  checked={formData.subscriptionTier === tier.id}
                  onClick={() => handleSubscriptionClick(tier.id)}
                  readOnly
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <label htmlFor={tier.id} className="ml-4 flex-1 cursor-pointer">
                  <span className="block text-base font-medium text-gray-900">
                    {tier.label} - {tier.price}
                  </span>
                </label>
              </div>
            ))}
            <button
            hidden
              type="button"
              className={`px-4 py-2 rounded mt-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition
                ${formData.subscriptionTier === "none" ? "bg-blue-50 border-blue-500 text-blue-700" : ""}
              `}
              onClick={handleClearSubscription}
              disabled={isLoading}
            >
              {formData.subscriptionTier === "none" ? "None selected" : "Clear selection (None)"}
            </button>
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-4">
            Add-ons 
          </label>
          <div className="space-y-4">
            {addOnOptions.map((addOn) => (
              <div
                key={addOn.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  id={addOn.id}
                  checked={formData.addOns.includes(addOn.id)}
                  onChange={(e) => handleAddOnChange(addOn.id, e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor={addOn.id} className="ml-4 flex-1">
                  <span className="block text-base font-medium text-gray-900">
                    {addOn.label} - {addOn.price}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Payment
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly subscription + one-time add-ons
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${calculateTotal().toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {formData.subscriptionTier !== "none" && (
                    <>
                      $
                      {subscriptionTiers
                        .find((tier) => tier.id === formData.subscriptionTier)
                        ?.value.toLocaleString()}
                      /month
                      {formData.addOns.length > 0 && (
                        <>
                          {" "}
                          + $
                          {formData.addOns
                            .reduce((sum, addOnId) => {
                              const addOn = addOnOptions.find(
                                (option) => option.id === addOnId
                              )
                              return sum + (addOn?.value || 0)
                            }, 0)
                            .toLocaleString()}{" "}
                          one-time
                        </>
                      )}
                    </>
                  )}
                  {formData.subscriptionTier === "none" &&
                    formData.addOns.length > 0 && (
                      <>
                        $
                        {formData.addOns
                          .reduce((sum, addOnId) => {
                            const addOn = addOnOptions.find(
                              (option) => option.id === addOnId
                            )
                            return sum + (addOn?.value || 0)
                          }, 0)
                          .toLocaleString()}{" "}
                        one-time
                      </>
                    )}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            {(formData.subscriptionTier !== "none" || formData.addOns.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Price Breakdown:
                </h4>
                <div className="space-y-1 text-sm">
                  {formData.subscriptionTier !== "none" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {
                          subscriptionTiers.find(
                            (tier) => tier.id === formData.subscriptionTier
                          )?.label
                        }{" "}
                        (Monthly)
                      </span>
                      <span className="font-medium">
                        $
                        {subscriptionTiers
                          .find((tier) => tier.id === formData.subscriptionTier)
                          ?.value.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {formData.addOns.map((addOnId) => {
                    const addOn = addOnOptions.find(
                      (option) => option.id === addOnId
                    )
                    return addOn ? (
                      <div key={addOnId} className="flex justify-between">
                        <span className="text-gray-600">
                          {addOn.label} (One-time)
                        </span>
                        <span className="font-medium">
                          ${addOn.value.toLocaleString()}
                        </span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Number and How did you hear about us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="mobileNumber"
              className="block text-sm font-medium text-gray-800 mb-2"
            >
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="mobileNumber"
              required
              value={formData.mobileNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="123-456-7890"
              maxLength={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="hearAboutUs"
              className="block text-sm font-medium text-gray-800 mb-2"
            >
              How did you hear about us?{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              id="hearAboutUs"
              required
              value={formData.hearAboutUs}
              onChange={(e) => handleInputChange("hearAboutUs", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select an option</option>
              {hearAboutUsOptions.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Company/Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            required
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            placeholder="Your Company Name"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Company Website */}
        <div>
          <label
            htmlFor="companyWebsite"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Company Website <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyWebsite"
            required
            value={formData.companyWebsite}
            onChange={(e) =>
              handleInputChange("companyWebsite", e.target.value)
            }
            placeholder="https://www.yourcompany.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6 flex justify-center">
          <button
            type="submit"
            className="bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-colors duration-200 flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            )}
            {isLoading ? "Processing..." : "Submit"}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-6 flex justify-center items-center text-blue-600 font-semibold">
          Processing your submission, please wait...
        </div>
      )}
    </div>
  )
}

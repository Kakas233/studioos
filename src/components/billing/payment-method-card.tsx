"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";

const BRAND_COLORS: Record<string, string> = {
  visa: "text-blue-400",
  mastercard: "text-orange-400",
  amex: "text-blue-300",
};

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface PaymentMethodCardProps {
  paymentMethod?: PaymentMethod | null;
  portalUrl?: string | null;
}

export default function PaymentMethodCard({
  paymentMethod,
  portalUrl,
}: PaymentMethodCardProps) {
  if (!paymentMethod) {
    return (
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#A8A49A]/50 text-sm">
            No payment method on file.
          </p>
          {portalUrl && (
            <Button
              variant="outline"
              size="sm"
              className="bg-background text-gray-900 mt-3 px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-8 border-white/[0.06] hover:bg-white/[0.04]"
              onClick={() => window.open(portalUrl, "_blank")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const brandColor = BRAND_COLORS[paymentMethod.brand] || "text-white";

  return (
    <Card className="bg-[#111111] border-white/[0.06]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg">Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-white/[0.04] rounded-md flex items-center justify-center border border-white/[0.06]">
            <CreditCard className={`w-5 h-5 ${brandColor}`} />
          </div>
          <div>
            <p className="text-white text-sm font-medium capitalize">
              {paymentMethod.brand} &bull;&bull;&bull;&bull;{" "}
              {paymentMethod.last4}
            </p>
            <p className="text-[#A8A49A]/40 text-xs">
              Expires{" "}
              {String(paymentMethod.exp_month).padStart(2, "0")}/
              {paymentMethod.exp_year}
            </p>
          </div>
        </div>

        {portalUrl && (
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.06] text-white hover:bg-white/[0.04]"
            onClick={() => window.open(portalUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Update Card
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

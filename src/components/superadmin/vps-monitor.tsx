"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ExternalLink, Maximize2, Minimize2 } from "lucide-react";

const VPS_URL = process.env.NEXT_PUBLIC_VPS_URL || "";

export default function VPSMonitor() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-[#AA0608]" /> Member Alert
          Monitor (VPS)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white"
          >
            {expanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <a href={VPS_URL} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-white/10">
          <iframe
            src={VPS_URL}
            title="VPS Member Alert Monitor"
            className="w-full border-0 rounded-b-xl"
            style={{ height: expanded ? "800px" : "500px" }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </CardContent>
    </Card>
  );
}

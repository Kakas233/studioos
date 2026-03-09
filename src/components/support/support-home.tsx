"use client";

import { X, ChevronRight, ExternalLink, MessageSquare } from "lucide-react";

interface SupportHomeProps {
  onClose: () => void;
  onNewConversation: () => void;
  onViewMessages: () => void;
  agentImages: Record<string, string>;
  unreadCount: number;
}

export default function SupportHome({
  onClose,
  onNewConversation,
  onViewMessages,
  agentImages,
  unreadCount,
}: SupportHomeProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-[#B5964D] to-[#9A7E3F] px-5 pt-5 pb-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold text-white tracking-tight">
            StudioOS
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex -space-x-2">
                {Object.entries(agentImages).map(([key, url]) => (
                  <img
                    key={key}
                    src={url}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-[#B5964D] object-cover"
                  />
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white">Hi there 👋</h2>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#F5F5F0] px-4 -mt-4 overflow-auto pt-6">
        {/* Send us a message card */}
        <button
          onClick={onNewConversation}
          className="w-full bg-white rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow mb-3 group"
        >
          <div>
            <span className="text-sm font-semibold text-gray-800 block">
              Start a chat
            </span>
            <span className="text-xs text-gray-400">
              We usually reply within an hour
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#B5964D] flex items-center justify-center group-hover:bg-[#A3863F] transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Links */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-3">
          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <span className="text-sm text-gray-700">
              Help Center &amp; Docs
            </span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
          <a
            href="mailto:support@getstudioos.com"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">Email us</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3 mb-2">
          We usually reply within an hour
        </p>
      </div>

      {/* Bottom tabs */}
      <div className="bg-white border-t border-gray-200 flex pb-[env(safe-area-inset-bottom)]">
        <button className="flex-1 flex flex-col items-center py-3 text-[#B5964D]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button
          onClick={onViewMessages}
          className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-gray-600 transition-colors relative"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Messages</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-1/2 ml-3 translate-x-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">
                {unreadCount}
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

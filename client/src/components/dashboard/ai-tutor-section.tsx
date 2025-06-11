import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AiTutorConversation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function AiTutorSection() {
  const [message, setMessage] = useState("");

  const { data: conversation, isLoading } = useQuery<AiTutorConversation>({
    queryKey: ["/api/ai-tutor/conversation"],
  });

  const messageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ai-tutor/message", {
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-tutor/conversation"],
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      messageMutation.mutate(message);
    }
  };

  // Get the last 2 messages for the preview
  const recentMessages = conversation?.messages
    ? conversation.messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .slice(-3)
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-neutrals-800">
          AI Learning Assistant
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["/api/ai-tutor/conversation"],
            })
          }
          className="text-accent hover:text-accent-dark"
        >
          <span className="material-icons">refresh</span>
        </Button>
      </div>

      <div className="bg-neutrals-50 rounded-lg p-3 mb-4 min-h-[160px]">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-3">
            <div className="flex items-start">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
            <div className="flex items-start ml-11">
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        ) : recentMessages.length > 0 ? (
          // Conversation messages
          recentMessages.map((msg, index) => {
            if (msg.role === "assistant") {
              return (
                <div key={index} className="flex items-start mb-3">
                  <div className="bg-primary p-2 rounded-full mr-3 text-white">
                    <span className="material-icons text-sm">smart_toy</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutrals-700">{msg.content}</p>
                  </div>
                </div>
              );
            } else if (msg.role === "user") {
              return (
                <div key={index} className="flex items-start ml-8 mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-neutrals-700">{msg.content}</p>
                  </div>
                </div>
              );
            }
            return null;
          })
        ) : (
          // Empty/initial state
          <div className="flex items-start mb-3">
            <div className="bg-primary p-2 rounded-full mr-3 text-white">
              <span className="material-icons text-sm">smart_toy</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutrals-700">
                Hi! I'm your VX Academy AI assistant. I can help you with
                questions about your courses, hospitality and tourism best practices, or
                patient care scenarios. How can I assist you today?
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="relative">
        <Input
          type="text"
          placeholder="Ask anything about your courses..."
          className="w-full rounded-full pr-12"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={messageMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-accent p-1.5 rounded-full hover:bg-accent-dark transition-colors"
          disabled={!message.trim() || messageMutation.isPending}
        >
          {messageMutation.isPending ? (
            <span className="material-icons text-sm animate-spin">refresh</span>
          ) : (
            <span className="material-icons text-sm">send</span>
          )}
        </Button>
      </form>

      <div className="mt-4">
        <p className="text-xs text-neutrals-500">
          Try asking about:{" "}
          <Link href="/ai-tutor" className="text-primary">
            assessment preparation
          </Link>
          ,{" "}
          <Link href="/ai-tutor" className="text-primary">
            difficult concepts
          </Link>
          , or{" "}
          <Link href="/ai-tutor" className="text-primary">
            patient care scenarios
          </Link>
        </p>
      </div>
    </div>
  );
}

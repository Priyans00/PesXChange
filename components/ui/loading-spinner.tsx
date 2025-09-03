import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  variant?: "default" | "dots" | "pulse" | "progress";
  showProgress?: boolean;
  progress?: number;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "Loading...",
  variant = "default",
  showProgress = false,
  progress = 0
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState("");

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Animated dots effect
  useEffect(() => {
    if (variant !== "dots") return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    
    return () => clearInterval(interval);
  }, [variant]);

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-bounce",
                  size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case "pulse":
        return (
          <div className={cn(
            "rounded-full bg-primary animate-pulse-soft",
            sizeClasses[size]
          )} />
        );
      
      case "progress":
        return (
          <div className="relative">
            <Zap className={cn("animate-spin text-primary", sizeClasses[size])} />
            {showProgress && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        );
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 animate-fadeIn", className)}>
      {renderSpinner()}
      {text && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>
          {variant === "dots" ? `${text}${dots}` : text}
        </p>
      )}
      {showProgress && variant !== "progress" && (
        <div className="w-32 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Enhanced loading states for different contexts
export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="progress" showProgress />
        <div className="mt-4 space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("inline-flex items-center justify-center gap-2", className)}>
      <LoadingSpinner size="sm" variant="dots" {...props} />
    </div>
  );
}

export function ButtonLoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  );
}

// Smart loading component that adapts based on loading time
export function SmartLoadingSpinner({ 
  className,
  onLongLoad,
  longLoadThreshold = 3000 
}: {
  className?: string;
  onLongLoad?: () => void;
  longLoadThreshold?: number;
}) {
  const [isLongLoad, setIsLongLoad] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 90));
    }, 200);

    // Check for long load
    const longLoadTimer = setTimeout(() => {
      setIsLongLoad(true);
      onLongLoad?.();
    }, longLoadThreshold);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(longLoadTimer);
    };
  }, [longLoadThreshold, onLongLoad]);

  if (isLongLoad) {
    return (
      <div className={cn("text-center", className)}>
        <LoadingSpinner 
          size="lg" 
          variant="progress" 
          text="This is taking longer than expected..." 
          showProgress
          progress={progress}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Please check your internet connection
        </p>
      </div>
    );
  }

  return (
    <LoadingSpinner 
      className={className}
      variant="default"
      showProgress
      progress={progress}
    />
  );
}

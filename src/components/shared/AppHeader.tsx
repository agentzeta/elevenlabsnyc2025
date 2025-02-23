
import { ArrowLeft, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  showBackButton?: boolean;
  className?: string;
}

export function AppHeader({ showBackButton = true, className = "" }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isIndex = location.pathname === "/";
  
  if (isIndex) return null;

  return (
    <header className={`border-b bg-white ${className}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <User className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl">Talented AI</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

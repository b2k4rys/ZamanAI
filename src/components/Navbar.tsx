import { Button } from "@/components/ui/button";
import { Globe, Target } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover">
            <span className="text-xl font-bold text-primary-foreground">Z</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Zaman AI</h1>
            <p className="text-xs text-muted-foreground">Ваш финансовый помощник</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Мои цели</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-xs">RU</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

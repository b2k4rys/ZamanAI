import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductMock } from "@/data/productsMock";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductMock | null;
}

export const ProductDetailDialog = ({ open, onOpenChange, product }: ProductDetailDialogProps) => {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{product.emoji}</span>
            <div>
              <DialogTitle className="text-xl">{product.name}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {product.apr}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">О продукте</h4>
            <p className="text-sm text-foreground leading-relaxed">
              {product.details || product.pitch}
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <Button className="w-full" size="lg">
              Оставить заявку
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

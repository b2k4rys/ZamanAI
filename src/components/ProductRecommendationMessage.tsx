import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductMock } from "@/data/productsMock";

interface ProductRecommendationMessageProps {
  products: ProductMock[];
  onActionClick: (action: string, product: ProductMock) => void;
}

export const ProductRecommendationMessage = ({ 
  products, 
  onActionClick 
}: ProductRecommendationMessageProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        Могу предложить варианты 👇
      </p>
      
      <div className="space-y-3">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{product.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-base leading-tight">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.apr}
                  </p>
                </div>
              </div>
              
              {/* Pitch */}
              <p className="text-sm text-foreground/80 leading-relaxed">
                {product.pitch}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-2">
                {product.cta.map((cta, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="secondary"
                    onClick={() => onActionClick(cta.action, product)}
                    className="font-medium"
                  >
                    {cta.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Goal } from '@/types/goal';
import { formatAmount } from '@/lib/goalCalculations';

interface GoalProgressDonutProps {
  goal: Goal;
  size?: number;
}

export const GoalProgressDonut = ({ goal, size = 120 }: GoalProgressDonutProps) => {
  const progress = goal.progress || 0;
  const saved = Number(goal.savedAmount) || 0;
  const target = Number(goal.targetAmount) || 0;
  const remaining = Math.max(0, target - saved);

  const data = [
    { name: 'Накоплено', value: saved, color: '#2D9A86' },
    { name: 'Осталось', value: remaining, color: '#E9F6F2' },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ fontSize: size * 0.2 }}
      >
        <div className="font-bold text-foreground">
          {(progress * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatAmount(saved)} ₸
        </div>
      </div>
    </div>
  );
};

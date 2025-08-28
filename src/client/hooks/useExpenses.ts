import { useQuery } from '@tanstack/react-query';
import { Expense } from '../../db/schema';

interface ExpenseWithDisplay extends Expense {
  displayAmount: number;
}

async function fetchExpenses(): Promise<ExpenseWithDisplay[]> {
  const response = await fetch('/api/expenses');
  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }
  return response.json();
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
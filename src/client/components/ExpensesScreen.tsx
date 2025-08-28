import React from 'react';
import { Link } from '@tanstack/react-router';
import { useExpenses } from '../hooks/useExpenses';

export function ExpensesScreen() {
  const { data: expenses, isLoading, error } = useExpenses();

  const totalExpenses = expenses ? expenses.reduce((sum, expense) => sum + expense.displayAmount, 0) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'entertainment': 'bg-purple-50 text-purple-700',
      'house_maintenance': 'bg-blue-50 text-blue-700', 
      'furniture': 'bg-indigo-50 text-indigo-700',
      'car': 'bg-red-50 text-red-700',
      'house_decoration': 'bg-pink-50 text-pink-700',
      'garden': 'bg-green-50 text-green-700',
      'travel': 'bg-yellow-50 text-yellow-700',
      'groceries': 'bg-emerald-50 text-emerald-700',
      'other': 'bg-gray-50 text-gray-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/debug" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
                <span className="text-sm font-medium">Back</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Loading expenses...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/debug" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
                <span className="text-sm font-medium">Back</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl p-8 text-center border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Expenses</h3>
            <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load expenses'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/debug" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Expenses</h1>
          <p className="text-slate-600">
            Total: {formatCurrency(totalExpenses)} • {expenses?.length || 0} {(expenses?.length || 0) === 1 ? 'expense' : 'expenses'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total</h3>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Average per Entry</h3>
            <p className="text-2xl font-bold text-slate-900">
              {expenses?.length ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Transactions</h3>
            <p className="text-2xl font-bold text-slate-900">{expenses?.length || 0}</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {!expenses || expenses.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses yet</h3>
              <p className="text-slate-600">Start tracking your expenses to see them here</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{expense.description}</h3>
                      <p className="text-sm text-slate-500">{formatDate(expense.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-slate-900">
                        {formatCurrency(expense.displayAmount)}
                      </span>
                      <p className="text-xs text-slate-500">{expense.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
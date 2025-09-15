import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, Brain, Utensils, BookOpen, ShoppingCart, Settings, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface MobileNavigationItem {
	to: string;
	label: string;
	icon: React.ReactNode;
}

const items: MobileNavigationItem[] = [
	{ to: '/dashboard', label: 'Home', icon: <Home className="h-5 w-5" /> },
	{ to: '/ai/meal-plan', label: 'AI Meal Plan', icon: <Brain className="h-5 w-5" /> },
	{ to: '/ai/recipes', label: 'AI Recipes', icon: <BookOpen className="h-5 w-5" /> },
	{ to: '/ai/shopping', label: 'AI Shopping', icon: <ShoppingCart className="h-5 w-5" /> },
	{ to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
	{ to: '/help', label: 'Help', icon: <HelpCircle className="h-5 w-5" /> },
];

const MobileNavigation: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { signOut, user } = useAuth();
	const { subscription } = useSubscription();

	const toggleMenu = () => setIsOpen(!isOpen);
	const closeMenu = () => setIsOpen(false);

	return (
		<div className="md:hidden">
			{/* Mobile Menu Button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={toggleMenu}
				className="p-2 h-10 w-10"
			>
				{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</Button>

			{/* Mobile Menu Overlay */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/60 z-40"
						onClick={closeMenu}
					/>
					
					{/* Menu Panel */}
					<div className="fixed left-0 top-0 h-full w-full sm:max-w-[24rem] bg-white z-50 shadow-2xl border-r overflow-y-auto transform transition-transform duration-300 ease-in-out">
						{/* Header */}
						<div className="h-16 px-6 flex items-center justify-between border-b bg-white">
							<div className="font-semibold text-lg tracking-tight">NutriVibe</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={closeMenu}
								className="p-2 h-8 w-8"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* User Info */}
						<div className="px-6 py-4 border-b bg-gray-50">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-emerald-600 text-white grid place-items-center text-sm font-medium">
									{user?.email?.[0]?.toUpperCase() ?? 'U'}
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-gray-900 truncate">
										{user?.email}
									</div>
									<div className="text-xs text-gray-500">
										Plan: <span className="font-medium capitalize">{subscription?.plan ?? 'free'}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Navigation Items */}
						<nav className="flex-1 px-3 py-4 space-y-1">
							{items.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									onClick={closeMenu}
									className={({ isActive }) =>
										cn(
											'relative flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-medium transition-colors',
											isActive
												? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600 pl-2'
												: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
										)
									}
								>
									{item.icon}
									<span>{item.label}</span>
								</NavLink>
							))}
						</nav>

						{/* Logout Button */}
						<div className="p-3 border-t bg-white">
							<Button
								variant="ghost"
								className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
								onClick={() => {
									closeMenu();
									signOut();
								}}
							>
								<LogOut className="h-4 w-4 mr-2" /> Log out
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default MobileNavigation;

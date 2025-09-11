import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Brain, Utensils, BookOpen, ShoppingCart, Settings, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface SidebarItem {
	to: string;
	label: string;
	icon: React.ReactNode;
}

const items: SidebarItem[] = [
	{ to: '/dashboard', label: 'Home', icon: <Home className="h-4 w-4" /> },
	{ to: '/ai/meal-plan', label: 'AI Meal Plan', icon: <Brain className="h-4 w-4" /> },
	{ to: '/ai/recipes', label: 'AI Recipes', icon: <BookOpen className="h-4 w-4" /> },
	{ to: '/ai/shopping', label: 'AI Shopping', icon: <ShoppingCart className="h-4 w-4" /> },
	{ to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
	{ to: '/help', label: 'Help', icon: <HelpCircle className="h-4 w-4" /> },
];

const Sidebar: React.FC = () => {
	const { signOut } = useAuth();

	return (
		<div className="hidden lg:flex lg:w-64 flex-col border-r bg-white/70 backdrop-blur-sm">
			<div className="h-16 px-5 flex items-center font-semibold text-lg tracking-tight">NutriVibe</div>
			<nav className="flex-1 px-2 space-y-1">
				{items.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							cn(
								'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-emerald-50 text-emerald-700'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'
							)
						}
					>
						{item.icon}
						<span>{item.label}</span>
					</NavLink>
				))}
			</nav>
			<div className="p-3 border-t">
				<Button variant="ghost" className="w-full justify-start" onClick={signOut}>
					<LogOut className="h-4 w-4 mr-2" /> Log out
				</Button>
			</div>
		</div>
	);
};

export default Sidebar;



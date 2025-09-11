import React from 'react';
import { Input } from '@/components/ui/input';
import { Bell, Sun, Moon, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import MobileNavigation from './MobileNavigation';

const AppHeader: React.FC = () => {
	const { user } = useAuth();
	const { subscription } = useSubscription();

	return (
		<header className="h-16 border-b bg-white/70 backdrop-blur-sm px-4 lg:px-6 flex items-center gap-4">
			{/* Mobile Navigation */}
			<MobileNavigation />
			
			{/* Search Bar - Hidden on very small screens, full width on mobile */}
			<div className="flex-1 max-w-2xl min-w-0">
				<Input 
					placeholder="Search anything" 
					className="h-10 w-full" 
				/>
			</div>
			
			{/* Right Side Actions */}
			<div className="flex items-center gap-2 lg:gap-3">
				{/* Plan Info - Hidden on small screens */}
				<div className="text-xs text-muted-foreground hidden sm:block">
					Plan: <span className="font-medium capitalize">{subscription?.plan ?? 'free'}</span>
				</div>
				
				{/* Action Buttons - Responsive sizing */}
				<button className="p-2 rounded-md hover:bg-muted">
					<Bell className="h-4 w-4 lg:h-5 lg:w-5" />
				</button>
				<button className="p-2 rounded-md hover:bg-muted">
					<Sun className="h-4 w-4 lg:h-5 lg:w-5" />
				</button>
				<button className="p-2 rounded-md hover:bg-muted">
					<Settings className="h-4 w-4 lg:h-5 lg:w-5" />
				</button>
				
				{/* User Avatar */}
				<div className="h-8 w-8 lg:h-8 lg:w-8 rounded-full bg-emerald-600 text-white grid place-items-center text-sm">
					{user?.email?.[0]?.toUpperCase() ?? 'U'}
				</div>
			</div>
		</header>
	);
};

export default AppHeader;



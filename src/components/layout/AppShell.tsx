import React from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex">
				<Sidebar />
				<div className="flex-1 flex flex-col min-w-0">
					<AppHeader />
					<main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
						{children}
					</main>
				</div>
			</div>
		</div>
	);
};

export default AppShell;



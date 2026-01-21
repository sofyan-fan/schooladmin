const { prisma } = require('../../prisma/connection');

// Get the current budget (there should only be one record)
exports.get_finance_budget = async (req, res) => {
	try {
		let budget = await prisma.finance_budget.findFirst();
		
		// Create default budget if none exists
		if (!budget) {
			budget = await prisma.finance_budget.create({
				data: { amount: 0 },
			});
		}
		
		res.status(200).json(budget);
	} catch (error) {
		console.error('Error fetching finance budget:', error);
		res.status(500).json({ error: 'Error retrieving finance budget' });
	}
};

// Update the budget amount
exports.update_finance_budget = async (req, res) => {
	try {
		const { amount } = req.body;
		
		if (amount === undefined || amount === null) {
			return res.status(400).json({ error: 'amount is required' });
		}
		
		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount)) {
			return res.status(400).json({ error: 'amount must be a valid number' });
		}
		
		// Find existing budget or create one
		let budget = await prisma.finance_budget.findFirst();
		
		if (budget) {
			budget = await prisma.finance_budget.update({
				where: { id: budget.id },
				data: { amount: parsedAmount },
			});
		} else {
			budget = await prisma.finance_budget.create({
				data: { amount: parsedAmount },
			});
		}
		
		res.status(200).json({ message: 'Budget updated', budget });
	} catch (error) {
		console.error('Error updating finance budget:', error);
		res.status(500).json({ error: 'Error updating finance budget' });
	}
};

export type ApiListResponse<Type> = {
	total: number;
	items: Type[];
};

export interface ApiResponse {
	items: ICard[];
}

export type CategoryType =
	| 'другое'
	| 'софт-скил'
	| 'дополнительное'
	| 'кнопка'
	| 'хард-скил';

export type CategoryMapping = {
	[Key in CategoryType]: string;
};

export interface ICard {
	id: string;
	description: string;
	image: string;
	title: string;
	category: CategoryType;
	price: number | null;
	selected: boolean;
}

export interface IOrder extends IOrderData {
	items: string[];
	total: number;
}

export interface IAppState {
	catalog: ICard[];
	preview: string;
	basket: string;
	order: IOrder;
	total: string | number;
	loading: boolean;
}

export interface IOrderData {
	payment: string;
	address: string;
	email: string;
	phone: string;
}

export interface IOrderResult {
	id: string;
	total: number;
}

export type FormErrors = Partial<Record<keyof IOrder, string>>;

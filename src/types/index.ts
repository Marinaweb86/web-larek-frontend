export interface ICard {
	_id: string;
	name: string;
	description: string;
	image: string;
	price: number | null;
}

export interface IOrder {
	adress: string;
	email: string;
	phone: number;
}

export interface ICardsData {
	cards: ICard[];
	preview: string | null;
	deliteCard(cardId: string,paylouid:  Function|null):void;
}

export interface IOrderData {
	payment:string;
	adress: string;
	email: string;
	phone: number;
}

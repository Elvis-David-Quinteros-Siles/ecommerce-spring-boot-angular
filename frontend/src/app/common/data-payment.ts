export class DataPayment {
    // El monto lo calcula el backend a partir de la orden (orderId)
    constructor(public method:string, public amount:string, public currency:string, public description:string, public orderId:number|null = null){

    }
}

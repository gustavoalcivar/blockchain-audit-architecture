const schema = 'dbo'

const database = 'mybank'

const configTable = 'blockchain_config'

const indexPath = 'C:\\bigchain\\index.js'

const parametrization = [
	{
		table: 'transacciones',
		columns: ['id','monto','id_cuenta_bancaria','id_tipo_transaccion']
	},
	{
		table: 'tipo_transaccion',
		columns: ['id','descripcion']
	},
	{
		table: 'cuentas_bancarias',
		columns: ['id','moneda','id_cliente','saldo']
	},
	{
		table: 'clientes',
		columns: ['id','nombre','apellido','telefono','correo']
	}
]

module.exports = {
	schema,
	database,
	configTable,
    indexPath,
    parametrization
}
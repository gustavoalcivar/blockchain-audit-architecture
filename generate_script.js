fs = require('fs')

const database = 'mybank'
const table = 'transacciones'
const columns = ['id','monto','id_cuenta_bancaria','id_tipo_transaccion']
const indexPath = 'C:\\bigchain\\index.js'

let strInsertDelete = '{'
let strUpdate = '{'
columns.forEach(item => {
    strInsertDelete = strInsertDelete + `\\"${item}\\":\\"',${item},'\\",`
    strUpdate = strUpdate + `\\"${item}_old\\":\\"',deleted.${item},'\\",` + `\\"${item}_new\\":\\"',inserted.${item},'\\",`
})
strInsertDelete = strInsertDelete.substring(0, strInsertDelete.length - 1) + '}'
strUpdate = strUpdate.substring(0, strUpdate.length - 1) + '}'

const data = `
use ${database}
go

-- To allow advanced options to be changed.
EXEC sp_configure 'show advanced options', 1
GO
-- To update the currently configured value for advanced options.
RECONFIGURE
GO
-- To enable the feature.
EXEC sp_configure 'xp_cmdshell', 1
GO
-- To update the currently configured value for this feature.
RECONFIGURE
GO

IF OBJECT_ID ('${table}_trigger', 'TR') IS NOT NULL
BEGIN
   DROP TRIGGER dbo.${table}_trigger
END
GO
CREATE TRIGGER dbo.${table}_trigger
ON dbo.${table}
 AFTER INSERT, UPDATE, DELETE AS
 BEGIN
	declare @table varchar(MAX) = '${table}'
	declare @transaction varchar(MAX)
	declare @data varchar(MAX)
	declare @cmd varchar(MAX)
	
	if exists (Select * from inserted) and not exists(Select * from deleted)
	begin
		set @transaction = 'INSERT'
		select @data = concat('${strInsertDelete}') from inserted;
	end
	if exists(SELECT * from inserted) and exists (SELECT * from deleted)
	begin
		set @transaction = 'UPDATE'
		select @data = concat('${strUpdate}') from inserted, deleted;
	end
	If exists(select * from deleted) and not exists(Select * from inserted)
	begin
		set @transaction = 'DELETE'
		select @data = concat('${strInsertDelete}') from deleted;
	end
	set @cmd = 'node ${indexPath} ${database} ${table} ' + @transaction + ' ' + SYSTEM_USER + ' ' + @data
	EXEC Master..xp_cmdshell @cmd
 END
 GO
`
fs.writeFile(`script_${database}_${table}.sql`, data, function (err) {
    if (err) return console.log(err)
    console.log(`script_${database}_${table}.sql`)
})
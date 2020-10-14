fs = require('fs')
const { schema, database, configTable, indexPath, parametrization } = require('./config')

let data = `
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

IF OBJECT_ID('${database}.${schema}.${configTable}') IS NULL
 BEGIN
	create table ${schema}.${configTable}(active bit)
	insert into ${schema}.${configTable} values(1)
 END
GO
`
parametrization.forEach(table => {
	let strInsertDelete = '{'
	let strUpdate = '{'
	table.columns.forEach(item => {
		strInsertDelete = strInsertDelete + `\\"${item}\\":\\"',${item},'\\",`
		strUpdate = strUpdate + `\\"${item}_old\\":\\"',deleted.${item},'\\",` + `\\"${item}_new\\":\\"',inserted.${item},'\\",`
	})
	strInsertDelete = strInsertDelete.substring(0, strInsertDelete.length - 1) + '}'
	strUpdate = strUpdate.substring(0, strUpdate.length - 1) + '}'
	
	data = data + `
	IF OBJECT_ID ('${table.table}_trigger', 'TR') IS NOT NULL
	BEGIN
	DROP TRIGGER ${schema}.${table.table}_trigger
	END
	GO
	CREATE TRIGGER ${schema}.${table.table}_trigger
	ON ${schema}.${table.table}
	AFTER INSERT, UPDATE, DELETE AS
	BEGIN
		IF EXISTS (SELECT 1 FROM ${configTable} WHERE active = 1)
		BEGIN
			declare @transaction nvarchar(4000)
			declare @data nvarchar(4000)
			declare @cmd nvarchar(4000)
			
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
			set @cmd = 'node ${indexPath} ${database} ${table.table} ' + @transaction + ' ' + SYSTEM_USER + ' ' + @data
			EXEC Master..xp_cmdshell @cmd
		END
	END
	GO
	print 'Trigger ${schema}.${table.table}_trigger created successfully'
	GO
	`
})

fs.writeFile(`script_${database}.sql`, data, function (err) {
    if (err) return console.log(err)
    console.log(`script_${database}.sql`)
})
BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[FacturaDocente] (
    [id] INT NOT NULL IDENTITY(1,1),
    [entidadId] INT NOT NULL,
    [puntoVenta] NVARCHAR(5) NOT NULL,
    [numero] NVARCHAR(8) NOT NULL,
    [fecha] DATE NOT NULL,
    [importe] DECIMAL(18,2) NOT NULL,
    [anioHonorarios] INT NOT NULL,
    [mesHonorarios] INT NOT NULL,
    [cuentaGastosId] INT NOT NULL,
    [observaciones] NVARCHAR(4000),
    [asientoPagoId] INT,
    [empresaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [FacturaDocente_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FacturaDocente_entidadId_puntoVenta_numero_key] UNIQUE NONCLUSTERED ([entidadId],[puntoVenta],[numero])
);

-- AddForeignKey
ALTER TABLE [dbo].[FacturaDocente] ADD CONSTRAINT [FacturaDocente_entidadId_fkey] FOREIGN KEY ([entidadId]) REFERENCES [dbo].[Entidad]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FacturaDocente] ADD CONSTRAINT [FacturaDocente_cuentaGastosId_fkey] FOREIGN KEY ([cuentaGastosId]) REFERENCES [dbo].[Cuenta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FacturaDocente] ADD CONSTRAINT [FacturaDocente_asientoPagoId_fkey] FOREIGN KEY ([asientoPagoId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FacturaDocente] ADD CONSTRAINT [FacturaDocente_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

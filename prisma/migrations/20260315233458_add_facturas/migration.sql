BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Empresa] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [cuit] NVARCHAR(1000) NOT NULL,
    [direccion] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [logo] NVARCHAR(1000),
    [monedaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Empresa_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Empresa_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Empresa_cuit_key] UNIQUE NONCLUSTERED ([cuit])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [password] NVARCHAR(1000),
    [emailVerified] DATETIME2,
    [image] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Role_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Permission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [userId] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([userId],[roleId])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [roleId] NVARCHAR(1000) NOT NULL,
    [permissionId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([roleId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[EmpresaUsuario] (
    [empresaId] INT NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000),
    CONSTRAINT [EmpresaUsuario_pkey] PRIMARY KEY CLUSTERED ([empresaId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] TEXT,
    [access_token] TEXT,
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] TEXT,
    [session_state] NVARCHAR(1000),
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [VerificationToken_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[Ejercicio] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] INT NOT NULL,
    [inicio] DATETIME2 NOT NULL,
    [fin] DATETIME2 NOT NULL,
    [cerrado] BIT NOT NULL CONSTRAINT [Ejercicio_cerrado_df] DEFAULT 0,
    [empresaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ejercicio_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Ejercicio_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Ejercicio_numero_empresaId_key] UNIQUE NONCLUSTERED ([numero],[empresaId])
);

-- CreateTable
CREATE TABLE [dbo].[Cuenta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [codigo] NVARCHAR(1000) NOT NULL,
    [codigoCorto] INT,
    [nombre] NVARCHAR(1000) NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [padreId] INT,
    [empresaId] INT NOT NULL,
    [ejercicioId] INT NOT NULL,
    [imputable] BIT NOT NULL CONSTRAINT [Cuenta_imputable_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cuenta_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Cuenta_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cuenta_codigo_ejercicioId_key] UNIQUE NONCLUSTERED ([codigo],[ejercicioId])
);

-- CreateTable
CREATE TABLE [dbo].[Asiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] INT NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [descripcion] NVARCHAR(1000) NOT NULL,
    [ejercicioId] INT NOT NULL,
    [anulaAId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Asiento_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Asiento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RenglonAsiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [debe] DECIMAL(18,2) NOT NULL CONSTRAINT [RenglonAsiento_debe_df] DEFAULT 0,
    [haber] DECIMAL(18,2) NOT NULL CONSTRAINT [RenglonAsiento_haber_df] DEFAULT 0,
    [leyenda] NVARCHAR(1000),
    [cuentaId] INT NOT NULL,
    [asientoId] INT NOT NULL,
    [monedaId] INT NOT NULL,
    [cotizacion] DECIMAL(18,4) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RenglonAsiento_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [RenglonAsiento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Entidad] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [cuit] NVARCHAR(1000) NOT NULL,
    [tipoId] INT NOT NULL,
    [empresaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Entidad_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Entidad_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentoProveedores] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tipo] NVARCHAR(1000) NOT NULL,
    [numero] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [montoTotal] DECIMAL(18,2) NOT NULL,
    [iva] DECIMAL(18,2) NOT NULL,
    [entidadId] INT NOT NULL,
    [empresaId] INT NOT NULL,
    [asientoId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentoProveedores_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [DocumentoProveedores_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentoClientes] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tipo] NVARCHAR(1000) NOT NULL,
    [numero] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL,
    [montoTotal] DECIMAL(18,2) NOT NULL,
    [iva] DECIMAL(18,2) NOT NULL,
    [entidadId] INT NOT NULL,
    [empresaId] INT NOT NULL,
    [asientoId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DocumentoClientes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [DocumentoClientes_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PedidosPagos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ejercicioId] INT NOT NULL,
    [empresaId] INT NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [fechaPedido] DATETIME2 NOT NULL,
    [totalPedido] DECIMAL(18,2) NOT NULL,
    [concepto] NVARCHAR(1000) NOT NULL,
    [solicitadoPor] NVARCHAR(1000) NOT NULL,
    [anulado] BIT NOT NULL CONSTRAINT [PedidosPagos_anulado_df] DEFAULT 0,
    [fechaAnulacion] DATETIME2,
    [anuladoPor] NVARCHAR(1000),
    [autorizado] BIT NOT NULL CONSTRAINT [PedidosPagos_autorizado_df] DEFAULT 0,
    [fechaAutorizacion] DATETIME2,
    [autorizadoPor] NVARCHAR(1000),
    [nroPago] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PedidosPagos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [PedidosPagos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Pagos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ejercicioId] INT NOT NULL,
    [empresaId] INT NOT NULL,
    [pedidoId] INT NOT NULL,
    [fechaPago] DATETIME2 NOT NULL,
    [importeBruto] DECIMAL(18,2) NOT NULL,
    [importeNeto] DECIMAL(18,2) NOT NULL,
    [asientoId] INT,
    [formaPagoId] INT NOT NULL,
    [beneficiarioId] NVARCHAR(1000),
    [descripcion] NVARCHAR(1000),
    [concepto] NVARCHAR(1000) NOT NULL,
    [anulado] BIT NOT NULL CONSTRAINT [Pagos_anulado_df] DEFAULT 0,
    [fechaAnulacion] DATETIME2,
    [anuladoPor] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Pagos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Pagos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[FormaPago] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [FormaPago_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [FormaPago_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Moneda] (
    [id] INT NOT NULL IDENTITY(1,1),
    [codigo] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [simbolo] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Moneda_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Moneda_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Moneda_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[Cotizacion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fecha] DATETIME2 NOT NULL,
    [valor] DECIMAL(18,4) NOT NULL,
    [monedaId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cotizacion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [Cotizacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cotizacion_fecha_monedaId_key] UNIQUE NONCLUSTERED ([fecha],[monedaId])
);

-- CreateTable
CREATE TABLE [dbo].[TipoEntidad] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TipoEntidad_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000),
    [updatedBy] NVARCHAR(1000),
    CONSTRAINT [TipoEntidad_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TipoEntidad_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[facturas] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tipo_comprobante] NVARCHAR(10) NOT NULL,
    [cod_comprobante] NVARCHAR(10),
    [punto_venta] NVARCHAR(10) NOT NULL,
    [numero_comprobante] NVARCHAR(20) NOT NULL,
    [fecha_emision] DATE NOT NULL,
    [fecha_vto_pago] DATE,
    [periodo_desde] DATE,
    [periodo_hasta] DATE,
    [condicion_venta] NVARCHAR(50),
    [cae_numero] NVARCHAR(30),
    [cae_vto] DATE,
    [razon_social_emisor] NVARCHAR(200) NOT NULL,
    [cuit_emisor] NVARCHAR(20) NOT NULL,
    [domicilio_emisor] NVARCHAR(300),
    [ingresos_brutos] NVARCHAR(50),
    [condicion_iva_emisor] NVARCHAR(100),
    [inicio_actividades] DATE,
    [razon_social_receptor] NVARCHAR(200),
    [cuit_receptor] NVARCHAR(20),
    [domicilio_receptor] NVARCHAR(300),
    [condicion_iva_receptor] NVARCHAR(100),
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [facturas_subtotal_df] DEFAULT 0,
    [otros_tributos] DECIMAL(18,2) NOT NULL CONSTRAINT [facturas_otros_tributos_df] DEFAULT 0,
    [importe_total] DECIMAL(18,2) NOT NULL CONSTRAINT [facturas_importe_total_df] DEFAULT 0,
    [archivo_origen] NVARCHAR(500) NOT NULL,
    [hash_archivo] NVARCHAR(64),
    [procesado_en] DATETIME2 NOT NULL CONSTRAINT [facturas_procesado_en_df] DEFAULT CURRENT_TIMESTAMP,
    [estado] NVARCHAR(20) NOT NULL CONSTRAINT [facturas_estado_df] DEFAULT 'ok',
    [observaciones] NVARCHAR(4000),
    CONSTRAINT [facturas_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [facturas_cuit_emisor_punto_venta_numero_comprobante_tipo_comprobante_key] UNIQUE NONCLUSTERED ([cuit_emisor],[punto_venta],[numero_comprobante],[tipo_comprobante])
);

-- CreateTable
CREATE TABLE [dbo].[factura_items] (
    [id] INT NOT NULL IDENTITY(1,1),
    [factura_id] INT NOT NULL,
    [codigo] NVARCHAR(50),
    [descripcion] NVARCHAR(4000),
    [cantidad] DECIMAL(18,4),
    [unidad_medida] NVARCHAR(50),
    [precio_unitario] DECIMAL(18,2),
    [bonificacion_pct] DECIMAL(5,2) CONSTRAINT [factura_items_bonificacion_pct_df] DEFAULT 0,
    [importe_bonif] DECIMAL(18,2) CONSTRAINT [factura_items_importe_bonif_df] DEFAULT 0,
    [subtotal] DECIMAL(18,2),
    CONSTRAINT [factura_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[log_procesamiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [archivo] NVARCHAR(500) NOT NULL,
    [evento] NVARCHAR(50) NOT NULL,
    [detalle] NVARCHAR(4000),
    [factura_id] INT,
    [fecha] DATETIME2 NOT NULL CONSTRAINT [log_procesamiento_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [log_procesamiento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Empresa] ADD CONSTRAINT [Empresa_monedaId_fkey] FOREIGN KEY ([monedaId]) REFERENCES [dbo].[Moneda]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaUsuario] ADD CONSTRAINT [EmpresaUsuario_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaUsuario] ADD CONSTRAINT [EmpresaUsuario_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ejercicio] ADD CONSTRAINT [Ejercicio_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cuenta] ADD CONSTRAINT [Cuenta_padreId_fkey] FOREIGN KEY ([padreId]) REFERENCES [dbo].[Cuenta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cuenta] ADD CONSTRAINT [Cuenta_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cuenta] ADD CONSTRAINT [Cuenta_ejercicioId_fkey] FOREIGN KEY ([ejercicioId]) REFERENCES [dbo].[Ejercicio]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asiento] ADD CONSTRAINT [Asiento_ejercicioId_fkey] FOREIGN KEY ([ejercicioId]) REFERENCES [dbo].[Ejercicio]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asiento] ADD CONSTRAINT [Asiento_anulaAId_fkey] FOREIGN KEY ([anulaAId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RenglonAsiento] ADD CONSTRAINT [RenglonAsiento_cuentaId_fkey] FOREIGN KEY ([cuentaId]) REFERENCES [dbo].[Cuenta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RenglonAsiento] ADD CONSTRAINT [RenglonAsiento_asientoId_fkey] FOREIGN KEY ([asientoId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RenglonAsiento] ADD CONSTRAINT [RenglonAsiento_monedaId_fkey] FOREIGN KEY ([monedaId]) REFERENCES [dbo].[Moneda]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Entidad] ADD CONSTRAINT [Entidad_tipoId_fkey] FOREIGN KEY ([tipoId]) REFERENCES [dbo].[TipoEntidad]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Entidad] ADD CONSTRAINT [Entidad_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoProveedores] ADD CONSTRAINT [DocumentoProveedores_entidadId_fkey] FOREIGN KEY ([entidadId]) REFERENCES [dbo].[Entidad]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoProveedores] ADD CONSTRAINT [DocumentoProveedores_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoProveedores] ADD CONSTRAINT [DocumentoProveedores_asientoId_fkey] FOREIGN KEY ([asientoId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoClientes] ADD CONSTRAINT [DocumentoClientes_entidadId_fkey] FOREIGN KEY ([entidadId]) REFERENCES [dbo].[Entidad]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoClientes] ADD CONSTRAINT [DocumentoClientes_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentoClientes] ADD CONSTRAINT [DocumentoClientes_asientoId_fkey] FOREIGN KEY ([asientoId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PedidosPagos] ADD CONSTRAINT [PedidosPagos_ejercicioId_fkey] FOREIGN KEY ([ejercicioId]) REFERENCES [dbo].[Ejercicio]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PedidosPagos] ADD CONSTRAINT [PedidosPagos_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pagos] ADD CONSTRAINT [Pagos_ejercicioId_fkey] FOREIGN KEY ([ejercicioId]) REFERENCES [dbo].[Ejercicio]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pagos] ADD CONSTRAINT [Pagos_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pagos] ADD CONSTRAINT [Pagos_pedidoId_fkey] FOREIGN KEY ([pedidoId]) REFERENCES [dbo].[PedidosPagos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pagos] ADD CONSTRAINT [Pagos_asientoId_fkey] FOREIGN KEY ([asientoId]) REFERENCES [dbo].[Asiento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pagos] ADD CONSTRAINT [Pagos_formaPagoId_fkey] FOREIGN KEY ([formaPagoId]) REFERENCES [dbo].[FormaPago]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cotizacion] ADD CONSTRAINT [Cotizacion_monedaId_fkey] FOREIGN KEY ([monedaId]) REFERENCES [dbo].[Moneda]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[factura_items] ADD CONSTRAINT [factura_items_factura_id_fkey] FOREIGN KEY ([factura_id]) REFERENCES [dbo].[facturas]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[log_procesamiento] ADD CONSTRAINT [log_procesamiento_factura_id_fkey] FOREIGN KEY ([factura_id]) REFERENCES [dbo].[facturas]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

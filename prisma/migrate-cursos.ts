import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

async function main() {
  const legacyUrl = "sqlserver://192.168.16.38;database=SysCursos;user=sa;password=261194;trustServerCertificate=true;"
  const prismaLegacy = new PrismaClient({
    datasources: { db: { url: legacyUrl } }
  })
  const prisma = new PrismaClient()

  try {
    console.log('Iniciando migración de cursos 2026...')

    // 1. Obtener Cursos 2026
    const cursosLegacy: any[] = await prismaLegacy.$queryRawUnsafe(`
      SELECT * FROM Curso WHERE AnioAcademico = 2026
    `)
    console.log(`Encontrados ${cursosLegacy.length} cursos legacy.`)

    for (const c of cursosLegacy) {
      // Verificar si existen rubro y servicio
      const rubroExists = await prisma.rubro.findUnique({ where: { id: c.IdRubro } })
      const servicioExists = await prisma.servicio.findUnique({ where: { id: c.DetalleRubroId } })

      if (!rubroExists || !servicioExists) {
        console.warn(`Saltando curso ${c.CursoId}: Rubro ${c.IdRubro} (${!!rubroExists}) o Servicio ${c.DetalleRubroId} (${!!servicioExists}) no encontrado.`)
        continue
      }

      await prisma.curso.upsert({
        where: { legacyId: c.CursoId },
        update: {
          nombre: c.CursoNombre,
          anioAcademico: c.AnioAcademico,
          fechaInicio: c.FechaInicio ? new Date(c.FechaInicio) : null,
          fechaFin: c.FechaFin ? new Date(c.FechaFin) : null,
          rubroId: c.IdRubro,
          servicioId: c.DetalleRubroId,
          costo: Number(c.ImpAlumno) || 0,
          estado: c.Estado,
        },
        create: {
          legacyId: c.CursoId,
          nombre: c.CursoNombre,
          anioAcademico: c.AnioAcademico,
          fechaInicio: c.FechaInicio ? new Date(c.FechaInicio) : null,
          fechaFin: c.FechaFin ? new Date(c.FechaFin) : null,
          rubroId: c.IdRubro,
          servicioId: c.DetalleRubroId,
          costo: Number(c.ImpAlumno) || 0,
          estado: c.Estado,
          empresaId: 1, // Default empresa
        }
      })
    }
    console.log('Cursos migrados/actualizados.')

    // 2. Obtener Alumnos (CursoCliente) que tienen inscripciones en esos cursos
    const cursoIds = cursosLegacy.map(c => c.CursoId).join(',')
    if (cursoIds) {
      const alumnosLegacy: any[] = await prismaLegacy.$queryRawUnsafe(`
        SELECT DISTINCT cc.* 
        FROM CursoCliente cc
        JOIN AlumCom ac ON cc.CodigoCliente = ac.CodigoCliente
        WHERE ac.CursoId IN (${cursoIds})
      `)
      console.log(`Encontrados ${alumnosLegacy.length} alumnos vinculados.`)

      for (const a of alumnosLegacy) {
        if (!a.Documento) continue;
        await prisma.alumno.upsert({
          where: { documento: String(a.Documento) },
          update: {
            apellido: a.Apellido || '',
            nombre: a.Nombre || '',
            email: a.Email,
            telefono: a.Telefono,
            celular: a.Celular,
            fechaNacimiento: a.FechaNac ? new Date(a.FechaNac) : null,
            sexo: a.Sexo,
          },
          create: {
            documento: String(a.Documento),
            apellido: a.Apellido || '',
            nombre: a.Nombre || '',
            email: a.Email,
            telefono: a.Telefono,
            celular: a.Celular,
            fechaNacimiento: a.FechaNac ? new Date(a.FechaNac) : null,
            sexo: a.Sexo,
          }
        })
      }
      console.log('Alumnos migrados/actualizados.')

      // 3. Migrar Inscripciones (AlumCom)
      const inscripcionesLegacy: any[] = await prismaLegacy.$queryRawUnsafe(`
        SELECT ac.*, cc.Documento
        FROM AlumCom ac
        JOIN CursoCliente cc ON ac.CodigoCliente = cc.CodigoCliente
        WHERE ac.CursoId IN (${cursoIds})
      `)
      console.log(`Procesando ${inscripcionesLegacy.length} inscripciones...`)

      for (const ins of inscripcionesLegacy) {
        const localCurso = await prisma.curso.findUnique({ where: { legacyId: ins.CursoId } })
        const localAlumno = await prisma.alumno.findUnique({ where: { documento: String(ins.Documento) } })

        if (localCurso && localAlumno) {
          await prisma.inscripcion.upsert({
            where: {
              cursoId_alumnoId: {
                cursoId: localCurso.id,
                alumnoId: localAlumno.id
              }
            },
            update: {
              estado: ins.EstadoInscrip,
              fechaInscripcion: ins.FechaCarga ? new Date(ins.FechaCarga) : new Date()
            },
            create: {
              cursoId: localCurso.id,
              alumnoId: localAlumno.id,
              estado: ins.EstadoInscrip,
              fechaInscripcion: ins.FechaCarga ? new Date(ins.FechaCarga) : new Date()
            }
          })
        }
      }
      console.log('Inscripciones migradas.')
    }

  } catch (error) {
    console.error('Error en migración:', error)
  } finally {
    await prismaLegacy.$disconnect()
    await prisma.$disconnect()
  }
}

main()

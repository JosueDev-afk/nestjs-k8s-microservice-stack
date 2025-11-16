import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class AddReviewDto {
  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  @IsString({ message: 'El ID de usuario debe ser una cadena de texto' })
  userId: string;

  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  userName: string;

  @IsNotEmpty({ message: 'La calificación es requerida' })
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating: number;

  @IsNotEmpty({ message: 'El comentario es requerido' })
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  comment: string;
}

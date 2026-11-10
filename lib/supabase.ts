import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'images'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** 把 Supabase Storage 的相對路徑轉成完整 public URL */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${path}`
}

/** App Store URL */
export const APP_STORE_URL = 'https://apps.apple.com/tw/app/tobg/id6791601219'

export type Crag = {
  id: string
  name: string
  cover_image_path: string | null
  city: string | null
  district: string
  approach_details: string
  hazard_note: string | null
  latitude: number | null
  longitude: number | null
  areas: Area[]
}

export type Area = {
  id: string
  crag_id: string
  name: string
  intro_text: string
  boulders: Boulder[]
}

export type Boulder = {
  id: string
  area_id: string
  name: string
  notes: string
  finding_notes: string
  sequence_number: number
  boulder_faces: BoulderFace[]
  boulder_situation_photos: SituationPhoto[]
}

export type BoulderFace = {
  id: string
  boulder_id: string
  label: string | null
  photo_path: string
  sort_order: number
  is_implicit_default: boolean
  route_segments: RouteSegment[]
}

export type RouteSegment = {
  id: string
  route: Route
}

export type Route = {
  id: string
  name: string
  grade: string
  first_ascent_by: string | null
}

export type SituationPhoto = {
  id: string
  image_path: string
  caption: string | null
  sort_order: number
}

/** 查詢 crag 詳情（for /crag/[id]） */
export async function fetchCrag(id: string): Promise<Crag | null> {
  const { data, error } = await supabase
    .from('crags')
    .select(`
      id, name, cover_image_path, city, district, approach_details, hazard_note, latitude, longitude,
      areas(
        id, crag_id, name, intro_text,
        boulders(
          id, area_id, name, notes, finding_notes, sequence_number,
          boulder_faces(
            id, boulder_id, label, photo_path, sort_order, is_implicit_default,
            route_segments(
              id,
              route:routes(id, name, grade, first_ascent_by)
            )
          ),
          boulder_situation_photos(id, image_path, caption, sort_order)
        )
      )
    `)
    .eq('id', id)
    .eq('moderation_status', 'approved')
    .single()

  if (error || !data) return null
  return data as unknown as Crag
}

/** 查詢 area 詳情（for /area/[id]）— 也帶出所屬 crag 的基本資訊 */
export async function fetchArea(id: string): Promise<(Area & { crag: Pick<Crag, 'id' | 'name'> }) | null> {
  const { data, error } = await supabase
    .from('areas')
    .select(`
      id, crag_id, name, intro_text,
      crag:crags(id, name),
      boulders(
        id, area_id, name, notes, finding_notes, sequence_number,
        boulder_faces(
          id, boulder_id, label, photo_path, sort_order, is_implicit_default,
          route_segments(
            id,
            route:routes(id, name, grade, first_ascent_by)
          )
        ),
        boulder_situation_photos(id, image_path, caption, sort_order)
      )
    `)
    .eq('id', id)
    .eq('moderation_status', 'approved')
    .single()

  if (error || !data) return null
  return data as unknown as Area & { crag: Pick<Crag, 'id' | 'name'> }
}

/** 查詢 boulder 詳情（for /boulder/[id]） */
export async function fetchBoulder(id: string): Promise<(Boulder & {
  area: { id: string; name: string; crag: Pick<Crag, 'id' | 'name'> }
}) | null> {
  const { data, error } = await supabase
    .from('boulders')
    .select(`
      id, area_id, name, notes, finding_notes, sequence_number,
      area:areas(
        id, name,
        crag:crags(id, name)
      ),
      boulder_faces(
        id, boulder_id, label, photo_path, sort_order, is_implicit_default,
        route_segments(
          id,
          route:routes(id, name, grade, first_ascent_by)
        )
      ),
      boulder_situation_photos(id, image_path, caption, sort_order)
    `)
    .eq('id', id)
    .eq('moderation_status', 'approved')
    .single()

  if (error || !data) return null
  return data as unknown as Boulder & { area: { id: string; name: string; crag: Pick<Crag, 'id' | 'name'> } }
}

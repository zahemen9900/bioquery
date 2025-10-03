import supabase from '@/lib/supabase-client'

export interface UserProfile {
	id: string
	email: string
	full_name: string | null
	nickname: string | null
	avatar_url: string | null
	last_login_at: string | null
}

export async function fetchUserProfile(userId: string) {
	const { data, error } = await supabase
		.from('users')
		.select('id, email, full_name, nickname, avatar_url, last_login_at')
		.eq('id', userId)
		.single<UserProfile>()

	if (error) throw error

	return data
}

export async function updateUserProfile(userId: string, payload: Partial<Omit<UserProfile, 'id'>>) {
	const { data, error } = await supabase
		.from('users')
		.update(payload)
		.eq('id', userId)
		.select('id, email, full_name, nickname, avatar_url, last_login_at')
		.single<UserProfile>()

	if (error) throw error

	return data
}

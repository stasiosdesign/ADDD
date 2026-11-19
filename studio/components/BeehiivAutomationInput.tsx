/* A report's beehiiv automation, picked from beehiiv's own list (2026-11-19).

   The list is read live from beehiiv through the site's server
   (src/sanity/beehiiv/automations.ts, on staging), which holds the beehiiv
   key: the Studio never sees it. A new automation made in beehiiv is in the
   list the next time it opens; a renamed one shows its new name (the list
   is always beehiiv's). What is kept on the report is the automation's ID,
   which is all the website uses, and its name as it was when picked, only
   for the warning when it has gone. Opening a report never changes it.

   It only ever reads: nothing here creates, edits or starts an automation. */
import {useCallback, useEffect, useMemo, useState} from 'react'
import {set, unset, useClient, type ObjectInputProps} from 'sanity'
import {Box, Button, Card, Flex, Select, Stack, Text} from '@sanity/ui'

type Value = {id?: string; name?: string}
type Automation = {id: string; name: string; status: string; active: boolean | null; apiTrigger: boolean | null}
type State =
  | {kind: 'loading'}
  | {kind: 'ready'; automations: Automation[]; at: string}
  | {kind: 'error'; message: string}

// The site whose server reads beehiiv: staging (the hosted Studio's preview
// site), or SANITY_STUDIO_BEEHIIV_ORIGIN where set (a local Studio reading
// staging, as a local site has no beehiiv key)
const ORIGIN = process.env.SANITY_STUDIO_BEEHIIV_ORIGIN || process.env.SANITY_STUDIO_PREVIEW_ORIGIN || ''
// Vercel's protection on staging is passed with its bypass secret, kept in
// the dataset by the Studio's own Vercel tool (studio/project.ts)
const BYPASS_QUERY = `*[_id == "sanity-preview-url-secret.vercel-protection-bypass" && _type == "sanity.vercelProtectionBypass"][0].secret`

function warning(automation: Automation | undefined, value: Value): string {
  if (!value.id) return ''
  if (!automation) return `“${value.name || value.id}” is no longer in beehiiv. Choose another.`
  if (automation.active === false) return `Not running in beehiiv (${automation.status}): publish it there first.`
  if (automation.apiTrigger === false) return 'Needs the “Added by API” trigger in beehiiv.'
  return ''
}

export function BeehiivAutomationInput(props: ObjectInputProps) {
  const {onChange, readOnly} = props
  const value = (props.value ?? {}) as Value
  const client = useClient({apiVersion: '2025-02-19'})
  const [state, setState] = useState<State>({kind: 'loading'})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setState({kind: 'loading'})
    ;(async () => {
      if (!ORIGIN) throw new Error('The Studio doesn’t know the website’s address (SANITY_STUDIO_PREVIEW_ORIGIN).')
      const url = new URL('/sanity/beehiiv/automations', ORIGIN)
      const bypass = await client.fetch<string | null>(BYPASS_QUERY).catch(() => null)
      if (bypass) url.searchParams.set('x-vercel-protection-bypass', bypass)
      const token = client.config().token
      const response = await fetch(url, {headers: {Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})}})
      const body = (await response.json().catch(() => null)) as {ok?: boolean; error?: string; automations?: Automation[]; at?: string} | null
      if (!response.ok || !body?.ok) throw new Error(body?.error || `The list couldn’t be read (${response.status}).`)
      if (live) setState({kind: 'ready', automations: body.automations ?? [], at: body.at ?? ''})
    })().catch((error: unknown) => {
      if (live) setState({kind: 'error', message: error instanceof Error ? error.message : String(error)})
    })
    return () => {
      live = false
    }
  }, [client, attempt])

  const automations = useMemo(() => (state.kind === 'ready' ? state.automations : []), [state])
  const current = useMemo(() => automations.find((automation) => automation.id === value.id), [automations, value.id])

  const choose = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const picked = automations.find((automation) => automation.id === event.currentTarget.value)
      if (!picked) return onChange(unset())
      onChange(set({id: picked.id, name: picked.name}))
    },
    [automations, onChange],
  )

  const note = state.kind === 'ready' ? warning(current, value) : ''

  return (
    <Stack gap={3}>
      <Select value={current ? current.id : value.id ? '__gone' : ''} onChange={choose} disabled={readOnly || state.kind !== 'ready'}>
        <option value="">{state.kind === 'loading' ? 'Reading beehiiv’s automations…' : 'No automation'}</option>
        {value.id && !current && <option value="__gone">{value.name || value.id} (not found in beehiiv)</option>}
        {automations.map((automation) => (
          <option key={automation.id} value={automation.id}>
            {automation.name}
            {automation.active === false ? ` (${automation.status || 'not running'})` : ''}
          </option>
        ))}
      </Select>
      {state.kind === 'error' && (
        <Card padding={3} radius={2} tone="critical" border>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Text size={1}>Couldn’t read beehiiv: {state.message}</Text>
            </Box>
            <Button text="Try again" mode="ghost" onClick={() => setAttempt((n) => n + 1)} />
          </Flex>
        </Card>
      )}
      {note && (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>{note}</Text>
        </Card>
      )}
      {state.kind === 'ready' && (
        <Text size={1} muted>
          {automations.length} in beehiiv. New ones appear when the report is reopened.
        </Text>
      )}
    </Stack>
  )
}

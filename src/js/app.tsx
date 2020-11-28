import React, {useState, useEffect, createContext, useContext, useRef} from 'react'
import classNames from 'classnames'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { text } from 'express'

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo()

class Channel {
  type: string
  channel: string
  name: string
  id: string
  sid: number
  nid: number
  hasLogoData: boolean
  n: number
  constructor(channel: any) {
    this.type = channel.type
    this.channel = channel.channel
    this.name = channel.name
    this.id = channel.id
    this.sid = channel.sid
    this.nid = channel.nid
    this.hasLogoData = channel.hasLogoData
    this.n = channel.n
  }
}

class Tuner {
  name: string
  command: string
  isScrambling: boolean
  constructor(tuner: any) {
    this.name = tuner.name
    this.command = tuner.command
    this.isScrambling = tuner.isScrambling
  }
}

class Program {
  id: string
  category: string
  title: string
  fullTitle: string
  detail: string
  start: Date
  end: Date
  seconds: number
  description: string
  extra: {
    [key: string]: string
  }
  channel: Channel
  subTitle: string
  episode?: number
  flags: string[]
  isConflict: boolean
  recordedFormat: string
  priority: number
  tuner: Tuner
  command: string
  recorded: string
  constructor(program: any){
    this.id = program.id
    this.category = program.category
    this.title = program.title
    this.fullTitle = program.fullTitle
    this.detail = program.detail
    this.start = new Date(program.start)
    this.end = new Date(program.end)
    this.seconds = program.seconds
    this.description = program.description
    this.extra = program.extra
    this.channel = new Channel(program.channel)
    this.subTitle = program.subTitle
    this.episode = program.episode
    this.flags = program.flags
    this.isConflict = program.isConflict
    this.recordedFormat = program.recordedFormat
    this.priority = program.priority
    this.tuner = new Tuner(program.tuner)
    this.command = program.command
    this.recorded = program.recorded
  }
}

enum Mode {
  Single,
  Series
}

const WatchedProgramsCotext = createContext<{watched: Program['id'][] | undefined, add?: ((id: Program['id']) => void)}>({watched: []})

export function App(){
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [errors, setErrors] = useState<Error[]>([])
  const [searchString, setSearchString] = useState('')
  const [watched, setWatched] = useLocalStorageJSON<Program['id'][]>('watched', [])
  const [mode, setMode] = useLocalStorageJSON<Mode>('listMode', Mode.Single)

  const reload = async () => {
    let res: Response
    try {
      res = await fetch('/api/recorded.json')
      if(!res.ok){
        throw new Error(`Failed to load recorded program list.`)
      }
    } catch(error) {
      addError(error)
      return
    }
    setPrograms(((await res.json()) as any[]).map(p => new Program(p)).sort((a, b) => b.start.getTime() - a.start.getTime()))
  }

  const addError = (error: Error) => {
    setErrors(errors => [...errors, error])
  }

  const addWatched = (id: Program['id']) => {
    if(watched){
      setWatched([...watched, id])
    } else {
      setWatched([id])
    }
  }

  useEffect(() => {
    reload()
  }, [])

  useEffect(() => {
    if(searchString.length > 0){
      setFilteredPrograms(
        programs.filter(program => searchString.split(/\s/).every(s => toHalfWidth(program.fullTitle).toLowerCase().includes(s.toLowerCase()))))
    } else {
      setFilteredPrograms(programs)
    }
  }, [programs, searchString])

  if(errors.length > 0){
    return <>
      <div className="error-container">
        {
          errors.map((error, i) => {
            return <div className="error" key={i}>
              <div className="error-message">{error.message}</div>
            </div>
          })
        }
      </div>
    </>
  }

  return <>
    <WatchedProgramsCotext.Provider value={{watched, add: addWatched}}>
      <button className="button" onClick={() => setMode(mode === Mode.Single ? Mode.Series : Mode.Single)}>{mode === Mode.Single ? 'Switch to series view' : 'Switch to single view'}</button>
      <div className="search-container">
        <input className="search-input" type="text" value={searchString} onChange={e => setSearchString(e.target.value)} placeholder="Search" />
      </div>
      <div className="program-container">
        { mode === Mode.Single &&
          filteredPrograms.map((program, i) => {
            return <SingleRow
              key={program.id}
              program={program}
              series={programs.filter(p => p.title === program.title)}
            />
          })
        }
        {
          mode === Mode.Series &&
          Object.entries(filteredPrograms.reduce((group, program) => {
            return {
              ...group,
              [program.title]: group[program.title] ? [...group[program.title], program] : [program]
            }
          }, {} as {[x: string]: Program[]})).map(([title, programs]) => {
            return <SeriesRow
              key={title}
              title={title}
              programs={programs}
              onDelete={reload}
            />
          })
        }
      </div>
    </WatchedProgramsCotext.Provider>
  </>
}
function SeriesRow({title, programs, onDelete}: {title: string, programs: Program[], onDelete: () => void}){
  const [showDetail, setShowDetail] = useState(false)
  const [optionKeyPressed, setoptionKeyPressed] = useState(false)
  useEffect(() => {
    const keyboardEventHandler = (e: KeyboardEvent) => {
      setoptionKeyPressed(e.altKey)
    }
    window.addEventListener('keydown', keyboardEventHandler)
    window.addEventListener('keyup', keyboardEventHandler)
    return () => {
      window.removeEventListener('keydown', keyboardEventHandler)
      window.removeEventListener('keyup', keyboardEventHandler)
    }
  }, [])
  return <div className={classNames('program-item', {'show-detail': showDetail})}>
    <div className="program-item-title" onClick={e => setShowDetail(!showDetail)}>
      <span className="title">{toHalfWidth(title)}</span>
      <span className="episode-count">{programs.length > 1 ? `${programs.length} episodes` : `${programs.length} episode`}</span>
      <span className="time-ago">{timeAgo.format(programs[0].start)}</span>
    </div>
    {optionKeyPressed &&
      <div className="program-item-button-container">
        <div className="program-item-button" onClick={async () => {
          await copyToClipboard(
            programs.map(program => `curl -o '${toHalfWidth(program.title)}${isNullish(program.episode) ? '' : ` #${program.episode?.toString().padStart(2, '0')}`}${program.subTitle ? ` 「${toHalfWidth(program.subTitle)}」` : ''}.m2ts' 'http://ubuntu.lan/api/recorded/${program.id}/watch.m2ts'`).join(' && \\\n')
          )
        }}>COPY DOWNLOAD SCRIPT</div>
        <div className="program-item-button" onClick={async () => {
          const searchParams = new URLSearchParams({
            '_method': 'delete'
          })
          for(let program of programs){
            await fetch(`/api/recorded/${program.id}.json`, {
              method: 'DELETE'
            })
            while((await fetch(`/api/recorded/${program.id}.json`)).ok){
              await wait(250)
            }
          }
          onDelete()
        }}>DELETE ALL</div>
      </div>
    }
    { showDetail &&
      <div className="program-item-detail-container">
        <div className="program-item-detail">
          <div className="program-item-detail-series-container">
            {programs.map(program => <SingleRow key={program.id} program={program} series={[]} />)}
          </div>
        </div>
      </div>
    }
  </div>
}
async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
function isNullish(value: any): boolean{
  return value === null || typeof value === 'undefined'
}

function SingleRow({program, series}: {program: Program, series: Program[]}){
  const [showDetail, setShowDetail] = useState(false)
  const {watched, add} = useContext(WatchedProgramsCotext)
  const url = `http://ubuntu.lan/api/recorded/${program.id}/watch.m2ts`
  return <div className={classNames('program-item', {watched: watched?.includes(program.id), 'show-detail': showDetail})}>
    <div className="program-item-title" onClick={e => setShowDetail(!showDetail)}>
      <span className="title">{toHalfWidth(program.title)}</span>
      {
        program.episode &&
        <span className="episode">#{program.episode}</span>
      }
      {
        program.subTitle &&
        <span className="subtitle">{toHalfWidth(program.subTitle)}</span>
      }
      <span className="time-ago">{timeAgo.format(program.start)}</span>
    </div>
    <div className="program-item-button-container">
      <a className="program-item-button" href={`vlc://${url}`} onClick={() => add?.(program.id)}>VLC</a>
      <div className="program-item-button" onClick={e => {
        copyToClipboard(url)
        add?.(program.id)
      }}>COPY</div>
    </div>
    { showDetail && <>
        <div className="program-item-detail-container">
          { program.description.trim().length > 0 &&
            <div className="program-item-detail">
              <div className="program-item-detail-value">{toHalfWidth(program.description)}</div>
            </div>
          }
          {
            Object.entries(program.extra).map(([name, value]) => <div key={name} className="program-item-detail">
              <div className="program-item-detail-name">{name}</div>
              <div className="program-item-detail-value"><LinkedText value={toHalfWidth(value)} /></div>
            </div>)
          }
          { series.length > 1 &&
            <div className="program-item-detail">
            <div className="program-item-detail-name">シリーズ</div>
              <div className="program-item-detail-series-container">
                {series.map(program => <SingleRow key={program.id} program={program} series={[]} />)}
              </div>
            </div>
          }
        </div>
      </>
    }
  </div>
}

function LinkedText({value}: {value: string}){
  const matches = Array.from(value.matchAll(/https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g))
  let result = matches.reduceRight(({result, value}, match, i) => {
    const start = match.index
    const end = (match.index ?? 0) + match[0].length
    const url = match[0]
    return {
      result: [<a key={i} href={url} target="_blank">{url}</a>, value.slice(end), ...result],
      value: value.slice(0, start)
    }
  }, {result: [] as (string | React.ReactElement)[], value})
  return <>
    {[result.value, ...result.result]}
  </>
}

function useLocalStorageJSON<T>(name: string, initialValue: T): [T | undefined, (value: T) => void]{
  const [value, setValue] = useState<T | undefined>(initialValue)

  const get = ():T | undefined => {
    const value = localStorage.getItem(name)
    if(value === null){
      return undefined
    } else {
      return JSON.parse(value)
    }
  }

  const set = (value: T) => {
    localStorage.setItem(name, JSON.stringify(value))
    setValue(get())
  }
  
  useEffect(() => {
    if(typeof get() === 'undefined'){
      set(initialValue)
    }
    setValue(get())

    const storageEventHandler = (e: StorageEvent) => {
      if(e.key === name){
        setValue(get())
      }
    }

    window.addEventListener('storage', storageEventHandler)
    return () => {
      window.removeEventListener('storage', storageEventHandler)
    }
  }, [])

  return [value, set]
}


async function copyToClipboard(data: string){
  if(navigator.clipboard){
    await navigator.clipboard.writeText(data)
  } else {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = data
    input.style.position = 'ablosute'
    input.style.visibility = 'none'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
}

function toHalfWidth(str: string){
  return str.replace(/[Ａ-Ｚａ-ｚ０-９！？＋：．，]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ')
}
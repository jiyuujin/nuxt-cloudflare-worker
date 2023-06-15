interface PreviewProps {
  title: string
}

export function Preview({ title }: PreviewProps) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 40,
        color: '#35495e',
        background: '#fff',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        border: '24px solid #35495e',
      }}
    >
      <div
        style={{
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          color: '#35495e',
          marginTop: 30,
          padding: '0 120px',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
        }}
      >
        {title}
      </div>
    </div>
  )
}

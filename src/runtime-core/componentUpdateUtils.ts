export function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1
  const { props: nextProps } = n2

  for (const prop in nextProps) {
    if (nextProps[prop] !== prevProps[prop]) {
      return true
    }
  }
  return false
}

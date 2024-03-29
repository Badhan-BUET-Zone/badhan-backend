import axios, {AxiosResponse, AxiosInstance} from 'axios'
const githubAxios: AxiosInstance = axios.create({
  baseURL: 'https://api.github.com/repos/Badhan-BUET-Zone/badhan-web/releases/latest'
})

export const handleGETGitReleaseInfo = async ():Promise<AxiosResponse> => {
  try {
    return await githubAxios.get('')
  } catch (e: any) {
    return e.response
  }
}

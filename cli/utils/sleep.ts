export async function sleep(timeInterval: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, timeInterval)
    });
}
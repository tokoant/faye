#set -ex

# Do a cleanup first.
echo "cleaning '/tmp/_MEI*' directories..."
rm -rf /tmp/_MEI*
echo "cleaned up '/tmp/_MEI*' directories..."

# Kill stuck [d]ocker-compose logs processes.
docker_compose_logs_pids=$(ps aux | grep "[d]ocker-compose logs" | awk '{print $2}')

if test -z "$docker_compose_logs_pids" 
then
  # nothing to do
  echo "No zombie [d]ocker-compose logs processes"
else
  # kill them all
  echo "killing pid of zombie [d]ocker-compose logs processes: $docker_compose_logs_pids"
  echo $docker_compose_logs_pids | xargs kill -9
fi

# Then report latest report

# Flag used in hddSpaceCheck job
echo "<<< START OF HDDCHECK OUTPUT >>>"

# If there is a disk mounted to /data, we check that as well.
# Example output: 
# Filesystem         Used    Avail Use%
# /dev/vda1      15193212 25261136  38%
if [ \( -d "/data" \) ]; then
  df --output=source,used,avail,pcent / /data
else
  df --output=source,used,avail,pcent /
fi

# Flag used in hddSpaceCheck job
echo "<<< END OF HDDCHECK OUTPUT >>>"

echo "<<< START OF HDDCHECK INODE OUTPUT >>>"

# Example output: 
# Filesystem        IUsed    IFree IUse%
# /dev/vda1      16201860 16566140   50%
if [ \( -d "/data" \) ]; then
  df --output=source,iused,iavail,ipcent / /data
else
  df --output=source,iused,iavail,ipcent /
fi

echo "<<< END OF HDDCHECK INODE OUTPUT >>>"
